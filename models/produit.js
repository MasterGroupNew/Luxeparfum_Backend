const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./category');

const Produit = sequelize.define('Produit', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100] // Nom entre 2 et 100 caractères
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0 // Prix ne peut pas être négatif
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0 // Quantité ne peut pas être négative
    }
  },
  // Images Cloudinary
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL complète de l\'image sur Cloudinary'
  },
  imageId: { // ✅ NOUVEAU CHAMP POUR CLOUDINARY
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Public ID Cloudinary pour la suppression de l\'image'
  },
  // Genre du parfum
  genre: {
    type: DataTypes.ENUM('Homme', 'Femme', 'Mixte'),
    allowNull: true,
    defaultValue: 'Mixte'
  },
  // Catégorie
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories', // Nom de la table, pas le modèle
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'produits',
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId']
    },
    {
      fields: ['genre']
    },
    {
      fields: ['prix']
    }
  ]
});

// ✅ Les associations sont définies dans models/index.js
// Ne pas les définir ici pour éviter les dépendances circulaires

module.exports = Produit;