const Produit = require('../models/produit');
const Category = require('../models/category');
const { cloudinary } = require('../config/upload');
const { Op } = require('sequelize');

// Ajouter un produit
exports.createProduct = async (req, res) => {
  try {
    const { nom, description, prix, quantite, categorie, genre } = req.body;

    // Validation basique
    if (!nom?.trim()) return res.status(400).json({ error: 'Le nom est obligatoire' });
    if (!description?.trim()) return res.status(400).json({ error: 'La description est obligatoire' });
    if (!categorie?.trim()) return res.status(400).json({ error: 'La catégorie est obligatoire' });

    const prixNumber = parseFloat(prix);
    const quantiteNumber = parseInt(quantite);

    if (isNaN(prixNumber) || prixNumber <= 0) return res.status(400).json({ error: 'Le prix doit être positif' });
    if (isNaN(quantiteNumber) || quantiteNumber < 0) return res.status(400).json({ error: 'La quantité doit être positive' });
    if (genre && !['Homme', 'Femme', 'Mixte'].includes(genre)) return res.status(400).json({ error: 'Genre invalide' });

    // Recherche ou création de la catégorie
    const [category] = await Category.findOrCreate({
      where: { nom: categorie.trim() },
      defaults: { description: `Catégorie ${categorie.trim()}`, genre: genre || 'Mixte' }
    });

    // Gestion de l'image Cloudinary
    let imagePath = null;
    let imageId = null;
    if (req.file) {
      imagePath = req.file.path;       // URL publique Cloudinary
      imageId = req.file.filename;     // public_id Cloudinary
    }

    const produit = await Produit.create({
      nom: nom.trim(),
      description: description.trim(),
      prix: prixNumber,
      quantite: quantiteNumber,
      genre: genre || 'Mixte',
      imagePath,
      imageId,
      categoryId: category.id
    });

    res.status(201).json({ message: 'Produit ajouté avec succès', produit });
  } catch (err) {
    console.error('Erreur createProduct:', err);
    res.status(500).json({ error: 'Erreur lors de la création du produit', details: err.message });
  }
};

// Récupérer tous les produits avec catégorie
exports.getProducts = async (req, res) => {
  try {
    const produits = await Produit.findAll({
      include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom', 'genre'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(produits);
  } catch (err) {
    console.error('Erreur getProducts:', err);
    res.status(500).json({ error: err.message });
  }
};

// Récupérer un produit par ID
exports.getProductById = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom', 'genre'] }]
    });
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mettre à jour un produit
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prix, quantite, genre, categoryId } = req.body;

    const produit = await Produit.findByPk(id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    // Gestion de la nouvelle image
    let updateData = { nom, description, prix, quantite, genre, categoryId };
    if (req.file) {
      // Supprimer l’ancienne image Cloudinary si existante
      if (produit.imageId) await cloudinary.uploader.destroy(produit.imageId);
      updateData.imagePath = req.file.path;
      updateData.imageId = req.file.filename;
    }

    await produit.update(updateData);
    res.json({ message: 'Produit mis à jour', produit });
  } catch (err) {
    console.error('Erreur updateProduct:', err);
    res.status(500).json({ error: err.message });
  }
};

// Supprimer un produit
exports.deleteProduct = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    // Supprimer l’image Cloudinary si existante
    if (produit.imageId) await cloudinary.uploader.destroy(produit.imageId);

    await produit.destroy();
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    console.error('Erreur deleteProduct:', err);
    res.status(500).json({ error: err.message });
  }
};

// Filtrer les produits
exports.filterProducts = async (req, res) => {
  try {
    const { categorie, genre, page = 1, sort = 'ASC', limit = 10 } = req.body;
    const whereClause = {};
    if (categorie) whereClause.categoryId = categorie;
    if (genre) whereClause.genre = genre;

    const offset = (page - 1) * limit;
    const products = await Produit.findAndCountAll({
      where: whereClause,
      order: [['prix', sort]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: Category, as: 'categorie', attributes: ['id', 'nom', 'genre'] }]
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

// Produits par genre
exports.getProductsByGender = async (req, res) => {
  try {
    const { genre } = req.params;
    if (!['Homme', 'Femme', 'Mixte'].includes(genre)) return res.status(400).json({ error: 'Genre invalide' });

    const products = await Produit.findAll({
      include: [{ model: Category, as: 'categorie', where: { genre }, attributes: ['id', 'nom', 'genre'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (err) {
    console.error('Erreur getProductsByGender:', err);
    res.status(500).json({ error: err.message });
  }
};
