// models/category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le nom de la catégorie est obligatoire.' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subcategories: {
      type: DataTypes.JSON, // tableau de sous-catégories
      allowNull: true,
      defaultValue: [],
    },
    genre: {
      type: DataTypes.ENUM('Homme', 'Femme', 'Mixte'),
      allowNull: false,
      defaultValue: 'Mixte',
      comment: 'Indique si le parfum est pour homme, femme ou mixte',
    },
  },
  {
    tableName: 'categories',
    timestamps: true,
    underscored: true,
  }
);

module.exports = Category;
