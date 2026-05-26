module.exports = (sequelize, DataTypes) => {
  const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'order_id',
      references: { model: 'repair_orders', key: 'id' },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'changed_by',
      references: { model: 'users', key: 'id' },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'order_status_history',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  });

  return OrderStatusHistory;
};
