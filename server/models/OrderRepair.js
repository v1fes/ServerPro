module.exports = (sequelize, DataTypes) => {
  const OrderRepair = sequelize.define('OrderRepair', {
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
    repairTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'repair_type_id',
      references: { model: 'repair_types', key: 'id' },
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    tableName: 'order_repairs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  });

  return OrderRepair;
};
