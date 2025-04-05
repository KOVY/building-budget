const { sequelize, Sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  subscription_type: {
    type: Sequelize.ENUM('trial', 'basic', 'professional', 'enterprise'),
    defaultValue: 'trial'
  },
  subscription_expires_at: {
    type: Sequelize.DATE,
    allowNull: true
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
  tableName: 'users',
  timestamps: true,
  underscored: true
});

module.exports = User;
