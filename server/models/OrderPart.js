module.exports = (sequelize, DataTypes) => {
  const OrderPart = sequelize.define('OrderPart', {
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
    partId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'part_id',
      references: { model: 'parts', key: 'id' },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    priceAtUse: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'price_at_use',
    },
  }, {
    tableName: 'order_parts',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  });

  return OrderPart;
};
