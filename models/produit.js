const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./category');

const Produit = sequelize.define('Produit', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prix: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false, // Changé à false car on veut toujours une catégorie
    references: {
      model: Category,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
}, {
  tableName: 'produits',
  timestamps: true,
});

// Définition des associations avec l'alias correct
//Produit.belongsTo(Category, { as: 'cartegorie', foreignKey: 'categoryId' });

module.exports = Produit;
