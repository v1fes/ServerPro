module.exports = (sequelize, DataTypes) => {
  const RepairType = sequelize.define('RepairType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'repair_types',
    underscored: true,
    timestamps: true,
  });

  return RepairType;
};
