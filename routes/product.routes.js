const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth.middleware');

// ✅ IMPORT DE LA CONFIGURATION CLOUDINARY
const { upload } = require('../config/upload');

// ❌ SUPPRIMER CETTE PARTIE (stockage local)
/*
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } });
*/

// =====================
// ROUTES PRODUITS
// =====================

// Ajouter un produit (admin uniquement)
router.post('/', auth(['admin']), upload.single('image'), productController.createProduct);
router.post('/add_product', auth(['admin']), upload.single('image'), productController.createProduct);

// Récupérer tous les produits (public)
router.get('/', productController.getProducts);
router.get('/get_product', productController.getProducts);

// Récupérer un produit par ID (public)
router.get('/get_product/:id', productController.getProductById);
router.get('/:id', productController.getProductById); // Route alternative RESTful

// Filtrer les produits (public)
router.post('/filter', productController.filterProducts);

// Récupérer les produits par genre (public)
router.get('/genre/:genre', productController.getProductsByGender);

// Mettre à jour un produit (admin uniquement)
router.put('/update_product/:id', auth(['admin']), upload.single('image'), productController.updateProduct);
router.put('/:id', auth(['admin']), upload.single('image'), productController.updateProduct); // Route alternative RESTful

// Supprimer un produit (admin uniquement)
router.delete('/delete_product/:id', auth(['admin']), productController.deleteProduct);
router.delete('/:id', auth(['admin']), productController.deleteProduct); // Route alternative RESTful

module.exports = router;