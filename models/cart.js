//Création d'un modèle de panier
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  //ajouter le produit_id et la quantité dans le panier
}, {
  timestamps: true,
  tableName: 'carts'
});
module.exports = Cart;