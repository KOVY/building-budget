const { sequelize, Sequelize } = require('../config/database');
const Project = require('./Project');

const Budget = sequelize.define('Budget', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  status: {
    type: Sequelize.ENUM('draft', 'final'),
    defaultValue: 'draft'
  },
  total_price: {
    type: Sequelize.DECIMAL(15, 2),
    defaultValue: 0
  },
  vat_rate: {
    type: Sequelize.DECIMAL(5, 2),
    defaultValue: 21.00
  },
  total_price_with_vat: {
    type: Sequelize.DECIMAL(15, 2),
    defaultValue: 0
  },
  created_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'budgets',
  timestamps: true,
  underscored: true
});

// Definice vztahu mezi Budget a Project
Budget.belongsTo(Project, {
  foreignKey: {
    name: 'project_id',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Project.hasMany(Budget, {
  foreignKey: 'project_id'
});

module.exports = Budget;
