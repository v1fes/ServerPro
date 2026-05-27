const bcrypt = require('bcryptjs');
const { User, RepairOrder, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      users: rows,
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
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, role, specialization } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, firstName, lastName, phone, role, specialization });
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const { firstName, lastName, phone, role, specialization, isActive } = req.body;
    await user.update({ firstName, lastName, phone, role, specialization, isActive });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });
    await user.update({ isActive: false });
    res.json({ message: 'Користувача деактивовано' });
  } catch (error) {
    next(error);
  }
};

exports.getMasters = async (req, res, next) => {
  try {
    const masters = await User.findAll({
      where: { role: 'master', isActive: true },
      attributes: {
        include: [
          [sequelize.literal(`(SELECT COUNT(*) FROM repair_orders WHERE master_id = "User".id AND status NOT IN ('ready', 'issued'))`), 'activeOrdersCount'],
        ],
      },
      order: [['firstName', 'ASC']],
    });
    res.json({ masters });
  } catch (error) {
    next(error);
  }
};
