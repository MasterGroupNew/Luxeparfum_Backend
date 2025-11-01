/**
 * @file models/index.js
 * @description Centralizes model imports and relationships for the application.
 * Defines associations between models and exports them for use in controllers and other parts of the application.
 */

const sequelize = require('../config/db');

// Import des modèles
const User = require('./users');
const Produit = require('./produit');
const Order = require('./orders');
const OrderProducts = require('./orderProducts');
const Cart = require('./cart');
const CartProduct = require('./cartProduct');
const Category = require('./category');

// =====================
// DÉFINITION DES RELATIONS
// =====================

// Relations commandes et utilisateurs
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// Relations commandes et produits (Many-to-Many)
Order.belongsToMany(Produit, { 
  through: OrderProducts, 
  foreignKey: 'orderId', 
  otherKey: 'produitId', 
  as: 'produits' 
});

Produit.belongsToMany(Order, { 
  through: OrderProducts, 
  foreignKey: 'produitId', 
  otherKey: 'orderId', 
  as: 'orders' 
});

// Relations panier et produits (Many-to-Many)
Cart.belongsToMany(Produit, { 
  through: CartProduct, 
  foreignKey: 'cartId', 
  otherKey: 'produitId', 
  as: 'produits' 
});

Produit.belongsToMany(Cart, { 
  through: CartProduct, 
  foreignKey: 'produitId', 
  otherKey: 'cartId', 
  as: 'carts' 
});

// Relations utilisateur et panier (One-to-One)
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart' });

// Relations produits et catégories (Many-to-One)
Produit.belongsTo(Category, { foreignKey: 'categoryId', as: 'categorie' });
Category.hasMany(Produit, { foreignKey: 'categoryId', as: 'produits' });

// =====================
// INITIALISATION DES MODÈLES
// =====================

/**
 * Initialise les modèles et synchronise la base de données
 * @param {Object} options - Options de synchronisation
 * @param {boolean} options.force - Si true, supprime et recrée les tables (⚠️ EFFACE LES DONNÉES)
 * @param {boolean} options.alter - Si true, modifie les tables pour correspondre aux modèles (RECOMMANDÉ en dev)
 * @returns {Promise<Object>} - Objet contenant tous les modèles
 */
const initializeModels = async (options = {}) => {
  try {
    console.log('🔄 Synchronisation de la base de données...');
    
    // Options de synchronisation
    const syncOptions = {
      force: options.force || false,  // ⚠️ Ne jamais utiliser en production
      alter: options.alter || false   // Modifie les colonnes pour correspondre au modèle
    };

    // Si en développement, utiliser alter pour ajouter les colonnes manquantes
    if (process.env.NODE_ENV === 'development' && !syncOptions.force) {
      syncOptions.alter = true;
      console.log('📝 Mode développement : alter activé (ajout/modification des colonnes)');
    }

    // Synchroniser la base de données
    await sequelize.sync(syncOptions);
    
    if (syncOptions.force) {
      console.log('⚠️  Tables supprimées et recréées (force: true)');
    } else if (syncOptions.alter) {
      console.log('✅ Tables synchronisées avec modifications (alter: true)');
    } else {
      console.log('✅ Tables synchronisées');
    }

    // Créer l'utilisateur admin par défaut
    try {
      await User.createAdminUser();
    } catch (error) {
      console.error('⚠️  Erreur création admin:', error.message);
      // Ne pas bloquer le démarrage si l'admin existe déjà
    }

    console.log('✅ Initialisation des modèles terminée\n');

    return {
      sequelize,
      User,
      Produit,
      Order,
      OrderProducts,
      Cart,
      CartProduct,
      Category
    };
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
};

// =====================
// FONCTION DE NETTOYAGE
// =====================

/**
 * Ferme proprement la connexion à la base de données
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture de la connexion:', error);
  }
};

// =====================
// EXPORTS
// =====================

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
  closeConnection
};