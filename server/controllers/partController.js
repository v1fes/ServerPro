const { Part } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const { search, category, deviceType, brand, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (category) where.category = category;
    if (deviceType) where.compatibleDeviceType = deviceType;
    if (brand) where.compatibleBrand = { [Op.iLike]: `%${brand}%` };

    const offset = (page - 1) * limit;
    const { count, rows } = await Part.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']],
    });

    res.json({
      parts: rows,
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
    const part = await Part.findByPk(req.params.id);
    if (!part) return res.status(404).json({ message: 'Запчастину не знайдено' });
    res.json({ part });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const part = await Part.create(req.body);
    res.status(201).json({ part });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const part = await Part.findByPk(req.params.id);
    if (!part) return res.status(404).json({ message: 'Запчастину не знайдено' });
    await part.update(req.body);
    res.json({ part });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const part = await Part.findByPk(req.params.id);
    if (!part) return res.status(404).json({ message: 'Запчастину не знайдено' });
    await part.destroy();
    res.json({ message: 'Запчастину видалено' });
  } catch (error) {
    next(error);
  }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const parts = await Part.findAll({
      where: sequelize.where(
        sequelize.col('quantity_in_stock'),
        Op.lte,
        sequelize.col('min_stock_level')
      ),
      order: [['quantityInStock', 'ASC']],
    });
    res.json({ parts });
  } catch (error) {
    // Fallback query without sequelize.where
    try {
      const { sequelize: sq } = require('../models');
      const parts = await Part.findAll({
        where: sq.literal('quantity_in_stock <= min_stock_level'),
        order: [['quantityInStock', 'ASC']],
      });
      res.json({ parts });
    } catch (err) {
      next(err);
    }
  }
};
