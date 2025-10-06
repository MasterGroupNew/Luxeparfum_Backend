const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/cartegoryController');
const auth = require('../middleware/auth.middleware');

// ➤ Routes pour les catégories

// Créer une catégorie (admin uniquement)
router.post('/add_category', auth(['admin']), categoryController.createCategory);

// Récupérer toutes les catégories
router.get('/get_categories', categoryController.getCategories);

// Récupérer une catégorie par ID
router.get('/get_category/:id', categoryController.getCategoryById);

// Mettre à jour une catégorie (admin uniquement)
router.put('/update_category/:id', auth(['admin']), categoryController.updateCategory);

// Supprimer une catégorie (admin uniquement)
router.delete('/delete_category/:id', auth(['admin']), categoryController.deleteCategory);

module.exports = router;
