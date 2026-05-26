const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Device = require('./Device')(sequelize, Sequelize);
db.RepairOrder = require('./RepairOrder')(sequelize, Sequelize);
db.OrderStatusHistory = require('./OrderStatusHistory')(sequelize, Sequelize);
db.Part = require('./Part')(sequelize, Sequelize);
db.OrderPart = require('./OrderPart')(sequelize, Sequelize);
db.RepairType = require('./RepairType')(sequelize, Sequelize);
db.OrderRepair = require('./OrderRepair')(sequelize, Sequelize);
db.Prediction = require('./Prediction')(sequelize, Sequelize);
db.Notification = require('./Notification')(sequelize, Sequelize);

// Define associations
// User -> Device (one client has many devices)
db.User.hasMany(db.Device, { foreignKey: 'clientId', as: 'devices' });
db.Device.belongsTo(db.User, { foreignKey: 'clientId', as: 'client' });

// Device -> RepairOrder
db.Device.hasMany(db.RepairOrder, { foreignKey: 'deviceId', as: 'orders' });
db.RepairOrder.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

// User (client) -> RepairOrder
db.User.hasMany(db.RepairOrder, { foreignKey: 'clientId', as: 'clientOrders' });
db.RepairOrder.belongsTo(db.User, { foreignKey: 'clientId', as: 'client' });

// User (master) -> RepairOrder
db.User.hasMany(db.RepairOrder, { foreignKey: 'masterId', as: 'masterOrders' });
db.RepairOrder.belongsTo(db.User, { foreignKey: 'masterId', as: 'master' });

// RepairOrder -> OrderStatusHistory
db.RepairOrder.hasMany(db.OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory' });
db.OrderStatusHistory.belongsTo(db.RepairOrder, { foreignKey: 'orderId', as: 'order' });
db.OrderStatusHistory.belongsTo(db.User, { foreignKey: 'changedBy', as: 'changedByUser' });

// RepairOrder <-> Part (many-to-many through OrderPart)
db.RepairOrder.belongsToMany(db.Part, { through: db.OrderPart, foreignKey: 'orderId', as: 'parts' });
db.Part.belongsToMany(db.RepairOrder, { through: db.OrderPart, foreignKey: 'partId', as: 'orders' });
db.RepairOrder.hasMany(db.OrderPart, { foreignKey: 'orderId', as: 'orderParts' });
db.OrderPart.belongsTo(db.RepairOrder, { foreignKey: 'orderId' });
db.OrderPart.belongsTo(db.Part, { foreignKey: 'partId', as: 'part' });

// RepairOrder <-> RepairType (many-to-many through OrderRepair)
db.RepairOrder.belongsToMany(db.RepairType, { through: db.OrderRepair, foreignKey: 'orderId', as: 'repairTypes' });
db.RepairType.belongsToMany(db.RepairOrder, { through: db.OrderRepair, foreignKey: 'repairTypeId', as: 'orders' });
db.RepairOrder.hasMany(db.OrderRepair, { foreignKey: 'orderId', as: 'orderRepairs' });
db.OrderRepair.belongsTo(db.RepairOrder, { foreignKey: 'orderId' });
db.OrderRepair.belongsTo(db.RepairType, { foreignKey: 'repairTypeId', as: 'repairType' });

// Device -> Prediction
db.Device.hasMany(db.Prediction, { foreignKey: 'deviceId', as: 'predictions' });
db.Prediction.belongsTo(db.Device, { foreignKey: 'deviceId', as: 'device' });

// User -> Notification
db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

module.exports = db;
