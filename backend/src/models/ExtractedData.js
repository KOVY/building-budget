const { sequelize, Sequelize } = require('../config/database');
const File = require('./File');

const ExtractedData = sequelize.define('ExtractedData', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  data_type: {
    type: Sequelize.STRING(50),
    allowNull: false
  },
  data_key: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  data_value: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  confidence: {
    type: Sequelize.DECIMAL(5, 2),
    defaultValue: 1.00,
    validate: {
      min: 0,
      max: 1
    }
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'extracted_data',
  timestamps: true,
  underscored: true
});

// Definice vztahu mezi ExtractedData a File
ExtractedData.belongsTo(File, {
  foreignKey: {
    name: 'file_id',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

File.hasMany(ExtractedData, {
  foreignKey: 'file_id'
});

module.exports = ExtractedData;
