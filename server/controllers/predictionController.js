const axios = require('axios');
const { Device, RepairOrder, Prediction, User, OrderRepair, RepairType } = require('../models');
const { analyzeDeviceHistory } = require('../services/geminiService');

const getDeviceRepairHistory = async (deviceId) => {
  const orders = await RepairOrder.findAll({
    where: { deviceId },
    include: [
      { model: OrderRepair, as: 'orderRepairs', include: [{ model: RepairType, as: 'repairType' }] },
    ],
    order: [['createdAt', 'ASC']],
  });

  return orders.map((o) => ({
    date: o.createdAt.toISOString().split('T')[0],
    description: o.description,
    diagnosis: o.diagnosis,
    repairTypes: o.orderRepairs?.map((r) => r.repairType?.name).join(', ') || '',
    cost: parseFloat(o.totalCost || 0),
    status: o.status,
  }));
};

// ML prediction from Python service
exports.predictML = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.deviceId, {
      include: [{ model: User, as: 'client' }],
    });
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    const repairHistory = await getDeviceRepairHistory(device.id);

    // Calculate features
    const ageMonths = device.purchaseDate
      ? Math.floor((Date.now() - new Date(device.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 24;

    const currentMonth = new Date().getMonth() + 1;
    const season = currentMonth <= 2 || currentMonth === 12 ? 'winter'
      : currentMonth <= 5 ? 'spring'
      : currentMonth <= 8 ? 'summer' : 'autumn';

    const features = {
      device_type: device.deviceType,
      brand: device.brand,
      model: device.model,
      age_months: ageMonths,
      total_repairs: repairHistory.length,
      months_since_last_repair: repairHistory.length > 0
        ? Math.floor((Date.now() - new Date(repairHistory[repairHistory.length - 1].date).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : ageMonths,
      total_cost: repairHistory.reduce((sum, r) => sum + r.cost, 0),
      last_repair_type: repairHistory.length > 0 ? repairHistory[repairHistory.length - 1].repairTypes : '',
      season,
    };

    let mlResult = null;
    try {
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, features, { timeout: 10000 });
      mlResult = mlResponse.data;
    } catch (err) {
      console.log('ML service unavailable, using Gemini only');
    }

    const prediction = await Prediction.create({
      deviceId: device.id,
      predictedFailureType: mlResult?.predicted_failure || null,
      probability: mlResult?.probability || null,
      predictedDate: mlResult?.predicted_date || null,
      modelVersion: mlResult?.model_version || null,
      source: 'ml',
    });

    res.json({ prediction, mlResult });
  } catch (error) {
    next(error);
  }
};

// Gemini AI analysis
exports.predictGemini = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    const repairHistory = await getDeviceRepairHistory(device.id);

    const ageMonths = device.purchaseDate
      ? Math.floor((Date.now() - new Date(device.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 24;

    const geminiResult = await analyzeDeviceHistory(
      { ...device.toJSON(), ageMonths },
      repairHistory
    );

    const topPrediction = geminiResult.predictedFailures?.[0];

    const prediction = await Prediction.create({
      deviceId: device.id,
      predictedFailureType: topPrediction?.type || null,
      probability: topPrediction?.probability || null,
      source: 'gemini',
      geminiAnalysis: geminiResult.analysis,
      recommendations: JSON.stringify({
        recommendations: geminiResult.recommendations,
        predictedFailures: geminiResult.predictedFailures,
        riskLevel: geminiResult.riskLevel,
      }),
    });

    res.json({ prediction, geminiAnalysis: geminiResult });
  } catch (error) {
    next(error);
  }
};

// Combined prediction (ML + Gemini)
exports.predictCombined = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.deviceId);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    const repairHistory = await getDeviceRepairHistory(device.id);
    const ageMonths = device.purchaseDate
      ? Math.floor((Date.now() - new Date(device.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 24;

    // ML prediction
    let mlResult = null;
    try {
      const currentMonth = new Date().getMonth() + 1;
      const season = currentMonth <= 2 || currentMonth === 12 ? 'winter'
        : currentMonth <= 5 ? 'spring'
        : currentMonth <= 8 ? 'summer' : 'autumn';

      const features = {
        device_type: device.deviceType,
        brand: device.brand,
        model: device.model,
        age_months: ageMonths,
        total_repairs: repairHistory.length,
        months_since_last_repair: repairHistory.length > 0
          ? Math.floor((Date.now() - new Date(repairHistory[repairHistory.length - 1].date).getTime()) / (1000 * 60 * 60 * 24 * 30))
          : ageMonths,
        total_cost: repairHistory.reduce((sum, r) => sum + r.cost, 0),
        last_repair_type: repairHistory.length > 0 ? repairHistory[repairHistory.length - 1].repairTypes : '',
        season,
      };
      const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/predict`, features, { timeout: 10000 });
      mlResult = mlResponse.data;
    } catch (err) {
      console.log('ML service unavailable');
    }

    // Gemini analysis
    const geminiResult = await analyzeDeviceHistory(
      { ...device.toJSON(), ageMonths },
      repairHistory
    );

    const topPrediction = geminiResult.predictedFailures?.[0];

    const prediction = await Prediction.create({
      deviceId: device.id,
      predictedFailureType: mlResult?.predicted_failure || topPrediction?.type || null,
      probability: mlResult?.probability || topPrediction?.probability || null,
      predictedDate: mlResult?.predicted_date || null,
      modelVersion: mlResult?.model_version || null,
      source: 'combined',
      geminiAnalysis: geminiResult.analysis,
      recommendations: JSON.stringify({
        recommendations: geminiResult.recommendations,
        predictedFailures: geminiResult.predictedFailures,
        riskLevel: geminiResult.riskLevel,
        mlPrediction: mlResult,
      }),
    });

    res.json({
      prediction,
      mlResult,
      geminiAnalysis: geminiResult,
    });
  } catch (error) {
    next(error);
  }
};

// Get latest predictions for a device
exports.getDevicePredictions = async (req, res, next) => {
  try {
    const predictions = await Prediction.findAll({
      where: { deviceId: req.params.deviceId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.json({ predictions });
  } catch (error) {
    next(error);
  }
};
