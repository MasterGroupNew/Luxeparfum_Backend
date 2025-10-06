/** CartProduct model represents the association between Cart and Product models. 
 * It includes fields for cart ID, product ID, and quantity.
 * This model is used to manage the products added to a user's cart in an e-commerce application
 * @module models/cartProduct
 * @requires sequelize
 * @requires config/db
 * @typedef {Object} CartProduct
 * @property {number} id - Unique identifier for the cart product entry.
 * @property {number} cartId - Foreign key referencing the Cart model.
 * @property {number} produitId - Foreign key referencing the Produit model.
 * @property {number} quantity - Quantity of the product in the cart, default is 1.
 * @description This model is used to manage the products added to a user's cart in an e-commerce application.
 * @example
 * const CartProduct = require('./cartProduct');
 * // Creating a new cart product entry
 * CartProduct.create({
 * cartId: 1,
 * produitId: 2,
 * quantity: 3
 * })
 * .then(cartProduct => {
 * console.log('Cart Product created:', cartProduct);
 * })
 * .catch(error => {
 * console.error('Error creating Cart Product:', error);
 * });
 * @exports CartProduct
 * @function initializeCartProduct - Initializes the CartProduct model and its associations.
 * @returns {Promise<CartProduct>} - A promise that resolves to the initialized CartProduct model.
 * @description This function sets up the CartProduct model and its associations with Cart and Produit models
 * during the application startup to ensure that the database schema is up-to-date.
 * @example
 * const { initializeCartProduct } = require('./cartProduct');
 * initializeCartProduct()
 *  .then(cartProduct => {
 * console.log('CartProduct model initialized:', cartProduct);
 *  })
 * .catch(err => {
 * console.error('Error initializing CartProduct model:', err);
 * }
 * 
 */



//mise en place des relations entre les models cart et produit
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const CartProduct = sequelize.define('CartProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  produitId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
});
module.exports = CartProduct;