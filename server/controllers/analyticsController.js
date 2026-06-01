const { RepairOrder, Device, User, RepairType, OrderRepair, OrderPart, Part, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res, next) => {
  try {
    const totalOrders = await RepairOrder.count();
    const activeOrders = await RepairOrder.count({ where: { status: { [Op.notIn]: ['ready', 'issued'] } } });
    const completedOrders = await RepairOrder.count({ where: { status: 'issued' } });
    const totalRevenue = await RepairOrder.sum('totalCost', { where: { status: 'issued' } }) || 0;
    const totalClients = await User.count({ where: { role: 'client' } });
    const totalMasters = await User.count({ where: { role: 'master', isActive: true } });
    const totalDevices = await Device.count();

    // Average repair time (days)
    const avgResult = await sequelize.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) as avg_days
      FROM repair_orders WHERE completed_at IS NOT NULL
    `, { type: sequelize.QueryTypes.SELECT });
    const avgRepairDays = avgResult[0]?.avg_days ? parseFloat(avgResult[0].avg_days).toFixed(1) : 0;

    res.json({
      totalOrders, activeOrders, completedOrders, totalRevenue,
      totalClients, totalMasters, totalDevices, avgRepairDays,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersByPeriod = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    let dateFormat;
    switch (groupBy) {
      case 'month': dateFormat = 'YYYY-MM'; break;
      case 'week': dateFormat = 'IYYY-IW'; break;
      default: dateFormat = 'YYYY-MM-DD';
    }

    const orders = await sequelize.query(`
      SELECT TO_CHAR(created_at, :dateFormat) as period, COUNT(*)::int as count,
             COALESCE(SUM(CASE WHEN status = 'issued' THEN total_cost ELSE 0 END), 0)::numeric(10,2) as revenue
      FROM repair_orders
      ${startDate && endDate ? 'WHERE created_at BETWEEN :startDate AND :endDate' : ''}
      GROUP BY period ORDER BY period
    `, {
      replacements: { dateFormat, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    res.json({ data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getFailureStats = async (req, res, next) => {
  try {
    // By device type
    const byDeviceType = await sequelize.query(`
      SELECT d.device_type, COUNT(*)::int as count
      FROM repair_orders ro
      JOIN devices d ON ro.device_id = d.id
      GROUP BY d.device_type ORDER BY count DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // By brand
    const byBrand = await sequelize.query(`
      SELECT d.brand, COUNT(*)::int as count
      FROM repair_orders ro
      JOIN devices d ON ro.device_id = d.id
      GROUP BY d.brand ORDER BY count DESC LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // By repair type
    const byRepairType = await sequelize.query(`
      SELECT rt.name, COUNT(*)::int as count
      FROM order_repairs orr
      JOIN repair_types rt ON orr.repair_type_id = rt.id
      GROUP BY rt.name ORDER BY count DESC LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // By status
    const byStatus = await sequelize.query(`
      SELECT status, COUNT(*)::int as count
      FROM repair_orders GROUP BY status
    `, { type: sequelize.QueryTypes.SELECT });

    // Monthly trends (last 12 months)
    const monthlyTrends = await sequelize.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
             COUNT(*)::int as total,
             COUNT(CASE WHEN status = 'issued' THEN 1 END)::int as completed,
             COALESCE(SUM(CASE WHEN status = 'issued' THEN total_cost ELSE 0 END), 0)::numeric(10,2) as revenue
      FROM repair_orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `, { type: sequelize.QueryTypes.SELECT });

    // Average cost by device type
    const avgCostByType = await sequelize.query(`
      SELECT d.device_type, 
             ROUND(AVG(ro.total_cost)::numeric, 0)::int as avg_cost,
             COUNT(*)::int as count
      FROM repair_orders ro
      JOIN devices d ON ro.device_id = d.id
      WHERE ro.status = 'issued' AND ro.total_cost > 0
      GROUP BY d.device_type ORDER BY avg_cost DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ byDeviceType, byBrand, byRepairType, byStatus, monthlyTrends, avgCostByType });
  } catch (error) {
    next(error);
  }
};

exports.getMastersPerformance = async (req, res, next) => {
  try {
    const masters = await sequelize.query(`
      SELECT u.id, u.first_name, u.last_name, u.specialization,
        COUNT(ro.id) as total_orders,
        COUNT(CASE WHEN ro.status = 'issued' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN ro.status NOT IN ('ready', 'issued') THEN 1 END) as active_orders,
        COALESCE(AVG(CASE WHEN ro.completed_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (ro.completed_at - ro.created_at)) / 86400 END), 0) as avg_days,
        COALESCE(SUM(CASE WHEN ro.status = 'issued' THEN ro.total_cost ELSE 0 END), 0) as total_revenue
      FROM users u
      LEFT JOIN repair_orders ro ON u.id = ro.master_id
      WHERE u.role = 'master' AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name, u.specialization
      ORDER BY completed_orders DESC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({ masters });
  } catch (error) {
    next(error);
  }
};
