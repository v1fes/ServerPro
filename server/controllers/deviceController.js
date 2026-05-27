const { Device, User, RepairOrder, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const { clientId, search, page = 1, limit = 20 } = req.query;
    const where = {};

    // Clients see only their devices
    if (req.user.role === 'client') {
      where.clientId = req.user.id;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Device.findAndCountAll({
      where,
      include: [{ model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      devices: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [
        { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
    });
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    // Clients can only see their own devices
    if (req.user.role === 'client' && device.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    res.json({ device });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { deviceType, brand, model, serialNumber, purchaseDate, clientId } = req.body;
    const ownerId = req.user.role === 'client' ? req.user.id : clientId;

    if (!ownerId) {
      return res.status(400).json({ message: 'clientId обов\'язковий' });
    }

    const photoUrl = req.file ? `/uploads/devices/${req.file.filename}` : null;

    const device = await Device.create({
      clientId: ownerId,
      deviceType,
      brand,
      model,
      serialNumber,
      purchaseDate,
      photoUrl,
    });

    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    if (req.user.role === 'client' && device.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    const { deviceType, brand, model, serialNumber, purchaseDate } = req.body;
    const updateData = { deviceType, brand, model, serialNumber, purchaseDate };
    if (req.file) {
      updateData.photoUrl = `/uploads/devices/${req.file.filename}`;
    }
    await device.update(updateData);
    res.json({ device });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });
    await device.destroy();
    res.json({ message: 'Пристрій видалено' });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    if (req.user.role === 'client' && device.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    const orders = await RepairOrder.findAll({
      where: { deviceId: device.id },
      include: [
        { model: User, as: 'master', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ device, orders });
  } catch (error) {
    next(error);
  }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    if (req.user.role === 'client' && device.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не завантажено' });
    }

    const photoUrl = `/uploads/devices/${req.file.filename}`;
    await device.update({ photoUrl });
    res.json({ device });
  } catch (error) {
    next(error);
  }
};
