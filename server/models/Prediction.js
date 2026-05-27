module.exports = (sequelize, DataTypes) => {
  const Prediction = sequelize.define('Prediction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'device_id',
      references: { model: 'devices', key: 'id' },
    },
    predictedFailureType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'predicted_failure_type',
    },
    probability: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    predictedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'predicted_date',
    },
    modelVersion: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'model_version',
    },
    source: {
      type: DataTypes.ENUM('ml', 'gemini', 'combined'),
      allowNull: false,
      defaultValue: 'ml',
    },
    geminiAnalysis: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'gemini_analysis',
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'predictions',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  });

  return Prediction;
};
