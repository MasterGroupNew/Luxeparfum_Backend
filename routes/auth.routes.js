const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth.middleware');
//
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir, limits: { fileSize: 5 * 1024 * 1024 } }); // 5 Mo max


// Inscription avec photo et adresse
router.post('/register', upload.single('photo'), authController.register);

// Connexion (email ou contact)
router.post('/login', authController.login);

// Ajouter un utilisateur (admin uniquement)
router.post('/add_user', upload.single('photo'), authController.addUser);

// Récupérer tous les utilisateurs (admin uniquement)
router.get('/getAllUsers', authController.getAllUsers);

// Récupérer un utilisateur par ID (admin uniquement)
router.get('/getUserById/:id', authController.getUserById);

// Mettre à jour un utilisateur (admin uniquement) - inclut adresse
router.put('/updateUser/:id', upload.single('photo'), authController.updateUser);

// Supprimer un utilisateur (admin uniquement)
router.delete('/deleteUser/:id', authController.deleteUser);

// Récupérer les utilisateurs par rôle (admin uniquement)
router.get('/getUsersByRole/:role', authController.getUsersByRole);

// Changer le mot de passe
router.put('/changePassword/:id', authController.changePassword);

// Réinitialiser le mot de passe
router.post('/resetPassword', authController.resetPassword);

// Mettre à jour le profil utilisateur (inclut photo et adresse)
router.put('/updateProfile', authMiddleware(), upload.single('photo'), authController.updateProfile);

// Récupérer le profil utilisateur connecté
router.get('/profile', authMiddleware(), authController.getProfile);

module.exports = router;
