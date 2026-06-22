const { RepairOrder, Device, User, OrderStatusHistory, OrderPart, OrderRepair, Part, RepairType, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

const canAccessOrder = (user, order) => {
  if (user.role === 'admin') return true;
  if (user.role === 'client') return order.clientId === user.id;
  if (user.role === 'master') return order.masterId === user.id;
  return false;
};

const denyOrderAccess = (req, res, order) => {
  if (canAccessOrder(req.user, order)) return false;
  res.status(403).json({ message: 'Немає доступу до цього замовлення' });
  return true;
};

const generateOrderNumber = () => {
  const date = new Date();
  const prefix = `SR${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const random = crypto.randomInt(1000, 9999);
  return `${prefix}-${random}`;
};

const createNotification = async (userId, title, message) => {
  await Notification.create({ userId, title, message });
};

exports.getAll = async (req, res, next) => {
  try {
    const { status, masterId, clientId, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === 'client') where.clientId = req.user.id;
    if (req.user.role === 'master') where.masterId = req.user.id;
    if (status) where.status = status;
    if (masterId && req.user.role === 'admin') where.masterId = masterId;
    if (clientId && req.user.role !== 'client') where.clientId = clientId;
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await RepairOrder.findAndCountAll({
      where,
      include: [
        { model: Device, as: 'device', attributes: ['id', 'deviceType', 'brand', 'model'] },
        { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'master', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      orders: rows,
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
    const order = await RepairOrder.findByPk(req.params.id, {
      include: [
        { model: Device, as: 'device' },
        { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'master', attributes: ['id', 'firstName', 'lastName', 'specialization'] },
        { model: OrderStatusHistory, as: 'statusHistory', include: [{ model: User, as: 'changedByUser', attributes: ['id', 'firstName', 'lastName'] }], order: [['createdAt', 'ASC']] },
        { model: OrderPart, as: 'orderParts', include: [{ model: Part, as: 'part' }] },
        { model: OrderRepair, as: 'orderRepairs', include: [{ model: RepairType, as: 'repairType' }] },
      ],
    });

    if (!order) return res.status(404).json({ message: 'Заявку не знайдено' });

    if (req.user.role === 'client' && order.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }
    if (req.user.role === 'master' && order.masterId !== req.user.id) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { deviceId, description, deadline, photoUrl } = req.body;

    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).json({ message: 'Пристрій не знайдено' });

    if (req.user.role === 'client' && device.clientId !== req.user.id) {
      return res.status(403).json({ message: 'Це не ваш пристрій' });
    }

    const clientId = req.user.role === 'client' ? req.user.id : device.clientId;

    let orderNumber = generateOrderNumber();
    // Ensure uniqueness
    while (await RepairOrder.findOne({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

    const order = await RepairOrder.create({
      orderNumber,
      deviceId,
      clientId,
      description,
      deadline,
      photoUrl,
      status: 'new',
    });

    await OrderStatusHistory.create({
      orderId: order.id,
      status: 'new',
      changedBy: req.user.id,
      comment: 'Заявку створено',
    });

    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const order = await RepairOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заявку не знайдено' });
    if (denyOrderAccess(req, res, order)) return;

    const { masterId, diagnosis, totalCost, deadline } = req.body;
    const previousMasterId = order.masterId;
    const updateData = { diagnosis, totalCost, deadline };
    if (req.user.role === 'admin') updateData.masterId = masterId;
    await order.update(updateData);

    if (req.user.role === 'admin' && masterId && masterId !== previousMasterId) {
      await createNotification(masterId, 'Нова заявка', `Вам призначено заявку ${order.orderNumber}`);
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await RepairOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заявку не знайдено' });
    if (denyOrderAccess(req, res, order)) return;

    const { status, comment } = req.body;
    const oldStatus = order.status;

    const updateData = { status };
    if (status === 'ready' || status === 'issued') {
      updateData.completedAt = new Date();
    }

    await order.update(updateData);

    await OrderStatusHistory.create({
      orderId: order.id,
      status,
      changedBy: req.user.id,
      comment: comment || `Статус змінено з "${oldStatus}" на "${status}"`,
    });

    // Notify client
    const statusLabels = {
      new: 'Нова', diagnostics: 'Діагностика', in_progress: 'В роботі',
      waiting_parts: 'Очікування запчастин', ready: 'Готово', issued: 'Видано',
    };
    await createNotification(
      order.clientId,
      'Зміна статусу заявки',
      `Статус заявки ${order.orderNumber} змінено на "${statusLabels[status] || status}"`
    );

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

exports.addPart = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const order = await RepairOrder.findByPk(req.params.id, { transaction: t });
    if (!order) { await t.rollback(); return res.status(404).json({ message: 'Заявку не знайдено' }); }
    if (!canAccessOrder(req.user, order)) {
      await t.rollback();
      return res.status(403).json({ message: 'Немає доступу до цього замовлення' });
    }

    const { partId, quantity } = req.body;
    const part = await Part.findByPk(partId, { lock: t.LOCK.UPDATE, transaction: t });
    if (!part) { await t.rollback(); return res.status(404).json({ message: 'Запчастину не знайдено' }); }

    if (part.quantityInStock < quantity) {
      await t.rollback();
      return res.status(400).json({ message: `Недостатньо на складі. Доступно: ${part.quantityInStock}` });
    }

    const orderPart = await OrderPart.create({
      orderId: order.id,
      partId: part.id,
      quantity,
      priceAtUse: part.price,
    }, { transaction: t });

    await part.update({ quantityInStock: part.quantityInStock - quantity }, { transaction: t });

    await t.commit();
    res.status(201).json({ orderPart });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.addRepairType = async (req, res, next) => {
  try {
    const order = await RepairOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заявку не знайдено' });
    if (denyOrderAccess(req, res, order)) return;

    const { repairTypeId, cost } = req.body;
    const orderRepair = await OrderRepair.create({
      orderId: order.id,
      repairTypeId,
      cost: cost || 0,
    });

    res.status(201).json({ orderRepair });
  } catch (error) {
    next(error);
  }
};

exports.getTimeline = async (req, res, next) => {
  try {
    const order = await RepairOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });
    if (denyOrderAccess(req, res, order)) return;

    const history = await OrderStatusHistory.findAll({
      where: { orderId: req.params.id },
      include: [{ model: User, as: 'changedByUser', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ timeline: history });
  } catch (error) {
    next(error);
  }
};

exports.trackByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const order = await RepairOrder.findOne({
      where: { orderNumber },
      attributes: ['id', 'orderNumber', 'status', 'description', 'createdAt', 'completedAt'],
      include: [
        { model: Device, as: 'device', attributes: ['deviceType', 'brand', 'model'] },
        { model: OrderStatusHistory, as: 'statusHistory', attributes: ['status', 'comment', 'createdAt'], order: [['createdAt', 'ASC']] },
      ],
    });

    if (!order) return res.status(404).json({ message: 'Заявку не знайдено' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
};
