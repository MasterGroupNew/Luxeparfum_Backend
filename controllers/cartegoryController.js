const Category = require('../models/category');
const Produit = require('../models/produit');

// ➤ Créer une nouvelle catégorie
exports.createCategory = async (req, res) => {
  try {
    const { nom, description, subcategories, genre } = req.body;

    if (!nom || nom.trim() === '') {
      return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire.' });
    }

    const validGenres = ['Homme', 'Femme', 'Mixte'];
    const categoryGenre = validGenres.includes(genre) ? genre : 'Mixte';

    const category = await Category.create({
      nom,
      description,
      subcategories: subcategories || [],
      genre: categoryGenre,
    });

    res.status(201).json({ message: 'Catégorie créée avec succès ✅', category });
  } catch (err) {
    console.error('Erreur createCategory:', err);
    res.status(400).json({ error: err.message });
  }
};

// ➤ Récupérer toutes les catégories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Produit, as: 'produits' }],
    });
    res.json(categories);
  } catch (err) {
    console.error('Erreur getCategories:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Récupérer une catégorie par ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [{ model: Produit, as: 'produits' }],
    });

    if (!category) return res.status(404).json({ error: 'Catégorie introuvable.' });

    res.json(category);
  } catch (err) {
    console.error('Erreur getCategoryById:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour une catégorie
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, subcategories, genre } = req.body;

    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Catégorie introuvable.' });

    category.nom = nom || category.nom;
    category.description = description || category.description;
    category.subcategories = subcategories || category.subcategories;

    const validGenres = ['Homme', 'Femme', 'Mixte'];
    if (genre && validGenres.includes(genre)) category.genre = genre;

    await category.save();

    res.json({ message: 'Catégorie mise à jour avec succès ✅', category });
  } catch (err) {
    console.error('Erreur updateCategory:', err);
    res.status(400).json({ error: err.message });
  }
};

// ➤ Supprimer une catégorie
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Catégorie introuvable.' });

    await category.destroy();
    res.json({ message: 'Catégorie supprimée avec succès ✅' });
  } catch (err) {
    console.error('Erreur deleteCategory:', err);
    res.status(500).json({ error: err.message });
  }
};
