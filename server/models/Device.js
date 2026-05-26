module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: { model: 'users', key: 'id' },
    },
    deviceType: {
      type: DataTypes.ENUM('phone', 'laptop', 'tablet', 'other'),
      allowNull: false,
      field: 'device_type',
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'serial_number',
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'purchase_date',
    },
    photoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'photo_url',
    },
  }, {
    tableName: 'devices',
    underscored: true,
    timestamps: true,
  });

  return Device;
};
