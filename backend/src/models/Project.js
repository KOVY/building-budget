const { sequelize, Sequelize } = require('../config/database');
const User = require('./User');

const Project = sequelize.define('Project', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  location: {
    type: Sequelize.STRING(255),
    allowNull: true
  },
  building_type: {
    type: Sequelize.ENUM('residential', 'commercial', 'industrial', 'other'),
    defaultValue: 'residential'
  },
  total_area: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0
  },
  complexity: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  status: {
    type: Sequelize.ENUM('draft', 'in_progress', 'completed'),
    defaultValue: 'draft'
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
  tableName: 'projects',
  timestamps: true,
  underscored: true
});

// Definice vztahu mezi Project a User
Project.belongsTo(User, {
  foreignKey: {
    name: 'user_id',
    allowNull: false
  },
  onDelete: 'CASCADE'
});

User.hasMany(Project, {
  foreignKey: 'user_id'
});

module.exports = Project;
