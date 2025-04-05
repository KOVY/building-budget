const { sequelize, Sequelize } = require('../config/database');
const Project = require('./Project');

const File = sequelize.define('File', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  original_name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  stored_name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  file_path: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  file_type: {
    type: Sequelize.ENUM('pdf', 'dwg', 'ifc'),
    allowNull: false
  },
  file_size: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('uploaded', 'processing', 'processed', 'error'),
    defaultValue: 'uploaded'
  },
  processing_message: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  upload_date: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'files',
  timestamps: true,
  underscored: true
});

// Definice vztahu mezi File a Project
File.belongsTo(Project, {
  foreignKey: {
    name: 'project_id',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Project.hasMany(File, {
  foreignKey: 'project_id'
});

module.exports = File;
