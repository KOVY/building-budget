const { sequelize, Sequelize } = require('../config/database');
const Budget = require('./Budget');
const File = require('./File');

const BudgetItem = sequelize.define('BudgetItem', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  category: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  quantity: {
    type: Sequelize.DECIMAL(10, 3),
    allowNull: false
  },
  unit: {
    type: Sequelize.STRING(20),
    allowNull: false
  },
  unit_price: {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false
  },
  total_price: {
    type: Sequelize.DECIMAL(15, 2),
    allowNull: false
  }
}, {
  tableName: 'budget_items',
  timestamps: true,
  underscored: true
});

// Definice vztahu mezi BudgetItem a Budget
BudgetItem.belongsTo(Budget, {
  foreignKey: {
    name: 'budget_id',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

Budget.hasMany(BudgetItem, {
  foreignKey: 'budget_id'
});

// Definice vztahu mezi BudgetItem a File (zdroj dat)
BudgetItem.belongsTo(File, {
  foreignKey: {
    name: 'source_file_id',
    allowNull: true
  },
  onDelete: 'SET NULL'
});

File.hasMany(BudgetItem, {
  foreignKey: 'source_file_id'
});

module.exports = BudgetItem;
