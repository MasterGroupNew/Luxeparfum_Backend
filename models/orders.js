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
  // SUPPRIMER produitId et quantite car on va utiliser une table de liaison
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
  // NOUVEAUX CHAMPS
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  customerInfo: {
    type: DataTypes.TEXT, // JSON stringifié
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  tableName: 'Orders'
});

module.exports = Order;