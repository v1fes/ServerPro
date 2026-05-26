module.exports = (sequelize, DataTypes) => {
  const RepairOrder = sequelize.define('RepairOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: 'order_number',
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'device_id',
      references: { model: 'devices', key: 'id' },
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: { model: 'users', key: 'id' },
    },
    masterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'master_id',
      references: { model: 'users', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('new', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'issued'),
      allowNull: false,
      defaultValue: 'new',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'total_cost',
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'photo_url',
    },
  }, {
    tableName: 'repair_orders',
    underscored: true,
    timestamps: true,
  });

  return RepairOrder;
};
