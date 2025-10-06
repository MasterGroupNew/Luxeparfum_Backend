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
}, {
  timestamps: false,
});

module.exports = OrderProducts;
