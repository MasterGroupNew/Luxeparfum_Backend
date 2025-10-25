const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 Mo max

// Ajouter un produit
//router.post('/', auth, upload.single('image'), productController.createProduct);
router.post('/', auth(['admin']), upload.single('image'), productController.createProduct);
//router.post('/add_product', auth, upload.single('image'), productController.createProduct);
router.post('/add_product', auth(['admin']), upload.single('image'), productController.createProduct);

// Récupérer tous les produits
router.get('/get_product', productController.getProducts);
router.get('/', productController.getProducts); // Route alternative plus RESTful

// Récupérer un produit par id
router.get('/get_product/:id', productController.getProductById);

// Filtrer les produits (changé de GET à POST)
router.post('/filter', productController.filterProducts);

// Récupérer les produits par genre (Homme, Femme, Mixte)
router.get('/genre/:genre', productController.getProductsByGender);

// Mettre à jour un produit
router.put('/update_product/:id',  upload.single('image'),auth(['admin']),productController.updateProduct);

// Supprimer un produit
router.delete('/delete_product/:id', auth(['admin']), productController.deleteProduct);

module.exports = router;