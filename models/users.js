const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Modèle User - Définition de la table des utilisateurs
 * Gère les informations personnelles, les credentials et les adresses des utilisateurs
 */
const User = sequelize.define(
  'User',
  {
    // Informations personnelles
    nom: { 
      type: DataTypes.STRING, 
      allowNull: false,
      validate: {
        len: [2, 50] // Le nom doit avoir entre 2 et 50 caractères
      }
    },
    prenoms: { 
      type: DataTypes.STRING, 
      allowNull: false,
      validate: {
        len: [2, 50] // Le prénom doit avoir entre 2 et 50 caractères
      }
    },
    // Informations de contact
    contact: { 
      type: DataTypes.STRING, 
      allowNull: false,
      validate: {
        is: /^[0-9+]{8,15}$/ // Format: numéros et + uniquement, entre 8 et 15 caractères
      }
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      validate: { 
        isEmail: true, // Doit être un email valide
        len: [5, 100]
      }
    },
    // Sécurité
    password: { 
      type: DataTypes.STRING, 
      allowNull: false,
      validate: {
        len: [6, 100] // Minimum 6 caractères pour le mot de passe
      }
    },
    role: { 
      type: DataTypes.ENUM('user', 'admin'), // Seuls 'user' et 'admin' sont autorisés
      defaultValue: 'user' 
    },
    // Profile - Images Cloudinary
    photoUrl: { 
      type: DataTypes.STRING, 
      allowNull: true,
      comment: 'URL complète de la photo sur Cloudinary'
    },
    photoId: { // ✅ NOUVEAU CHAMP POUR CLOUDINARY
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Public ID Cloudinary pour la suppression de l\'image'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // Compte actif par défaut
    },
    // Informations d'adresse
    street: {
      type: DataTypes.STRING,
      allowNull: true, // L'adresse est optionnelle
      validate: {
        len: [0, 100]
      }
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 50]
      }
    },
    postalCode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 10]
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Côte d\'Ivoire', // Pays par défaut
      validate: {
        len: [0, 50]
      }
    }
  },
  {
    tableName: 'users',
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    indexes: [
      { unique: true, fields: ['email'] },    // Email unique
      { unique: true, fields: ['contact'] },  // Contact unique
    ],
    // Hooks pour le hachage automatique du mot de passe
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  }
);

/**
 * Méthode pour vérifier si le mot de passe fourni correspond
 * @param {string} password - Mot de passe à vérifier
 * @returns {Promise<boolean>} - True si le mot de passe correspond
 */
User.prototype.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Méthode pour obtenir les données utilisateur sans le mot de passe
 * @returns {Object} - Utilisateur sans mot de passe
 */
User.prototype.toSafeObject = function() {
  const { password, ...userWithoutPassword } = this.toJSON();
  return userWithoutPassword;
};

/**
 * Créer l'utilisateur administrateur par défaut
 */
User.createAdminUser = async function() {
  try {
    const existingUser = await this.findOne({ where: { email: 'admin@example.com' } });
    if (!existingUser) {
      // Ne pas hasher le mot de passe ici car le hook beforeCreate le fera
      await this.create({
        nom: 'Admin',
        prenoms: 'Super',
        contact: '0123456789',
        email: 'admin@example.com',
        password: 'admin123', // Mot de passe en clair, sera hashé par le hook
        role: 'admin',
        photoUrl: null,
        photoId: null,
        street: null,
        city: 'Abidjan',
        postalCode: null,
        country: 'Côte d\'Ivoire'
      });
      console.log('✅ Utilisateur administrateur créé avec succès');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Mot de passe: admin123');
    } else {
      console.log('ℹ️ L\'administrateur existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    throw error;
  }
};

module.exports = User;  