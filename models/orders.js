const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  produitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  statut: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en attente',
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

module.exports = Order;