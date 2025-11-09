// models/OrderProducts.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderProducts = sequelize.define('OrderProducts', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  produitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Produits',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  timestamps: true,
  tableName: 'OrderProducts'
});

module.exports = OrderProducts;