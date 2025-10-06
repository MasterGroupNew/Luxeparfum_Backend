const Produit = require('../models/produit');
const Category = require('../models/category');
const { Op } = require('sequelize');

// Ajouter un produit
exports.createProduct = async (req, res) => {
  try {
    const { nom, description, prix, quantite, categoryId } = req.body;
    if (!nom || !description || !prix || !quantite || !categoryId) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });

    const imagePath = req.file ? req.file.path : null;

    const produit = await Produit.create({ nom, description, prix, quantite, imagePath, categoryId });
    res.status(201).json({ message: 'Produit ajouté', produit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Récupérer tous les produits avec la catégorie
exports.getProducts = async (req, res) => {
  try {
    const produits = await Produit.findAll({ 
      include: [{ 
        model: Category, 
        as: 'categorie',  // Correspond maintenant à l'alias défini dans models/index.js
        attributes: ['id', 'nom', 'genre'] 
      }],
      order: [['createdAt', 'DESC']]
    });

    if (!produits || produits.length === 0) {
      return res.status(200).json([]); // Retourne un tableau vide au lieu d'une erreur
    }

    res.status(200).json(produits);
  } catch (err) {
    console.error('Erreur getProducts:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
};

// Récupérer un produit par id avec catégorie
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const produit = await Produit.findByPk(id, { 
      include: [{ model: Category, as: 'categorie' }]  // Correction de l'alias
    });
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prix, quantite, categoryId } = req.body;
    const imagePath = req.file ? req.file.path : undefined;

    const produit = await Produit.findByPk(id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    await produit.update({ nom, description, prix, quantite, categoryId, ...(imagePath && { imagePath }) });
    res.json({ message: 'Produit mis à jour', produit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Produit.destroy({ where: { id } });
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Filtrer les produits
exports.filterProducts = async (req, res) => {
  try {
    const { 
      categorie, 
      genre,
      page = 1,
      sort = 'ASC',
      limit = 10
    } = req.body;

    const whereClause = {};
    
    if (categorie) whereClause.categoryId = categorie;
    if (genre) whereClause.genre = genre;

    const offset = (page - 1) * limit;

    const products = await Produit.findAndCountAll({
      where: whereClause,
      order: [['prix', sort]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: Category, as: 'categorie' }]  // Correction de l'alias
    });

    res.json({
      products: products.rows,
      total: products.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(products.count / limit)
    });
  } catch (err) {
    console.error('Erreur filterProducts:', err);
    res.status(500).json({ error: err.message });
  }
};

// Récupérer des produits par genre
exports.getProductsByGender = async (req, res) => {
  try {
    const { genre } = req.params;
    
    if (!['Homme', 'Femme', 'Mixte'].includes(genre)) {
      return res.status(400).json({ error: 'Genre invalide. Utilisez Homme, Femme ou Mixte' });
    }

    const products = await Produit.findAll({
      include: [{
        model: Category,
        as: 'categorie',  // Correction de l'alias
        where: { genre }
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (err) {
    console.error('Erreur getProductsByGender:', err);
    res.status(500).json({ error: err.message });
  }
};
