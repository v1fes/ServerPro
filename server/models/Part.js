module.exports = (sequelize, DataTypes) => {
  const Part = sequelize.define('Part', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    compatibleDeviceType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'compatible_device_type',
    },
    compatibleBrand: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'compatible_brand',
    },
    compatibleModel: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'compatible_model',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    quantityInStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'quantity_in_stock',
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'min_stock_level',
    },
  }, {
    tableName: 'parts',
    underscored: true,
    timestamps: true,
  });

  return Part;
};
