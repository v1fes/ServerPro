const { RepairType } = require('../models');

exports.getAll = async (_req, res, next) => {
  try {
    const repairTypes = await RepairType.findAll({
      order: [['name', 'ASC']],
    });
    res.json({ repairTypes });
  } catch (error) {
    next(error);
  }
};
