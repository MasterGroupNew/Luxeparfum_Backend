/**
 * @file models/index.js
 * @description Centralizes model imports and relationships for the application.
 * Defines associations between models and exports them for use in controllers and other parts of the application.
 * @requires sequelize
 * @requires models/users
 * @requires models/produit
 * @requires models/orders
 * @requires models/orderProducts
 * @requires models/cart
 * @requires models/cartProduct
 * @exports sequelize
 * @exports User
 *  @exports Produit
 * @exports Order
 * @exports OrderProducts
 * @exports Cart
 * @exports CartProduct
 * @function initializeModels - Initializes the models and their relationships, synchronizing the database.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the initialized models.
 * @description This function sets up the database tables and their associations.
 * It is called during the application startup to ensure that the database schema is up-to-date.
 * @example
 * const { initializeModels } = require('./models');
 * initializeModels()
 *   .then(models => {
 * console.log('Models initialized:', models);
 *   })
 * .catch(err => {
 * console.error('Error initializing models:', err);
 * }
 */

/**
 * @file models/index.js
 * @description Centralizes model imports and relationships for the application.
 * Defines associations between models and exports them for use in controllers and other parts of the application.
 */

const sequelize = require('../config/db');
const User = require('./users');
const Produit = require('./produit');
const Order = require('./orders');
const OrderProducts = require('./orderProducts');
const Cart = require('./cart');
const CartProduct = require('./cartProduct');
const Category = require('./category'); // Renommé de Cartegorie à Category

// Relations des commandes et utilisateurs
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsToMany(Produit, { through: OrderProducts, foreignKey: 'orderId', otherKey: 'produitId', as: 'produits' });

Produit.belongsToMany(Order, { through: OrderProducts, foreignKey: 'produitId', otherKey: 'orderId', as: 'orders' });
Cart.belongsToMany(Produit, { through: CartProduct, foreignKey: 'cartId', otherKey: 'produitId', as: 'produits' });
Produit.belongsToMany(Cart, { through: CartProduct, foreignKey: 'produitId', otherKey: 'cartId', as: 'carts' });

CartProduct.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
CartProduct.belongsTo(Produit, { foreignKey: 'produitId', as: 'produit' });

Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// Relations pour les produits et catégories
Produit.belongsTo(Category, { foreignKey: 'categoryId', as: 'categorie' });
Category.hasMany(Produit, { foreignKey: 'categoryId', as: 'produits' });

// Synchronisation
const initializeModels = async () => {
  await sequelize.sync({ alter: true }); // crée/maj les tables
  const existingUser = await User.findOne({ where: { email: 'admin@example.com' } });
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      nom: 'Admin',
      prenoms: 'User',
      contact: '0123456789',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      photoUrl: null,
    });
    console.log('Utilisateur administrateur créé ✅');
  } else {
    console.log('Cet utilisateur existe déjà.');
  }
  console.log('✅ Base et tables synchronisées.');
  return {
    sequelize,
    User,
    Produit,
    Order,
    OrderProducts,
    Cart,
    CartProduct,
    Category, // Renommé ici aussi
  };
};

module.exports = {
  sequelize,
  User,
  Produit,
  Order,
  OrderProducts,
  Cart,
  CartProduct,
  Category,
  initializeModels,
};
