const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { Op } = require('sequelize');
const { cloudinary } = require('../config/upload'); // ✅ Ajout de l'import

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.warn("⚠️ JWT_SECRET non défini, ajoute-le dans ton fichier .env");
}

// =====================
// Inscription
// =====================
exports.register = async (req, res) => {
  try {
    const { nom, prenoms, contact, email, password, role, street, city, postalCode, country } = req.body;

    if (!nom || !prenoms || !contact || !email || !password) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent être remplis." });
    }

    // Vérifier si l'email ou le contact existe déjà
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { contact }] },
    });
    if (existingUser) {
      return res.status(409).json({ error: "Un utilisateur avec cet email ou contact existe déjà." });
    }

    //const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenoms,
      contact,
      email,
      password,//: hashedPassword, // ✅ Correction : utiliser hashedPassword
      role: role || 'user',
      photoUrl: req.file ? req.file.path : null, // ✅ URL Cloudinary complète
      photoId: req.file ? req.file.filename : null, // ✅ ID Cloudinary pour suppression
      street,
      city,
      postalCode,
      country: country || 'Côte d\'Ivoire'
    });

    res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (err) {
    console.error("Erreur register:", err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Connexion
// =====================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifiant (email ou téléphone) et mot de passe requis." });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { contact: identifier }],
      },
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const valid = await bcrypt.compare(password, user.password);
    console.log('✅ Mot de passe vérifié pour l\'utilisateur:', user.id, user.email, user.contact, user.role, valid);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1d' });

    res.json({ message: 'Connexion réussie', token, user });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Ajouter un utilisateur (admin uniquement)
// =====================
exports.addUser = async (req, res) => {
  try {
    const { nom, prenoms, contact, email, password, role } = req.body;

    if (!nom || !prenoms || !contact || !email || !password || !role) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ email }, { contact }] },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Un utilisateur avec cet email ou contact existe déjà.' });
    }

    

    const newUser = await User.create({
      nom,
      prenoms,
      contact,
      email,
      password,
      role,
      photoUrl: req.file ? req.file.path : null, // ✅ URL Cloudinary
      photoId: req.file ? req.file.filename : null, // ✅ ID Cloudinary
    });

    res.status(201).json({ message: 'Utilisateur ajouté', user: newUser });
  } catch (err) {
    console.error("Erreur addUser:", err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Récupérer tous les utilisateurs
// =====================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // ✅ Ne pas renvoyer les mots de passe
    });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Récupérer un utilisateur par ID
// =====================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // ✅ Ne pas renvoyer le mot de passe
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Mettre à jour un utilisateur
// =====================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenoms, contact, email, password, role, street, city, postalCode, country } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    let photoUrl = user.photoUrl;
    let photoId = user.photoId;

    // ✅ Si une nouvelle photo est uploadée
    if (req.file) {
      // Supprimer l'ancienne photo de Cloudinary
      if (user.photoId) {
        try {
          await cloudinary.uploader.destroy(user.photoId);
          console.log('✅ Ancienne photo supprimée de Cloudinary');
        } catch (error) {
          console.error('⚠️ Erreur suppression ancienne photo:', error);
        }
      }
      
      // Utiliser la nouvelle photo
      photoUrl = req.file.path;
      photoId = req.file.filename;
    }

    const updatedData = {
      nom,
      prenoms,
      contact,
      email,
      role,
      photoUrl,
      photoId,
      street: street || user.street,
      city: city || user.city,
      postalCode: postalCode || user.postalCode,
      country: country || user.country
    };
    
    if (password) updatedData.password = await bcrypt.hash(password, 10);

    await user.update(updatedData);
    
    // ✅ Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({ message: 'Utilisateur mis à jour', user: userWithoutPassword });
  } catch (err) {
    console.error('Erreur updateUser:', err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Supprimer un utilisateur
// =====================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // ✅ Supprimer la photo de Cloudinary avant de supprimer l'utilisateur
    if (user.photoId) {
      try {
        await cloudinary.uploader.destroy(user.photoId);
        console.log('✅ Photo supprimée de Cloudinary');
      } catch (error) {
        console.error('⚠️ Erreur suppression photo:', error);
      }
    }

    await user.destroy();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('Erreur deleteUser:', err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Récupérer le profil utilisateur connecté
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // ✅ Ne pas renvoyer le mot de passe
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Mettre à jour le profil utilisateur connecté
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const { nom, prenoms, contact, email, password, street, city, postalCode, country } = req.body;
    
    let photoUrl = user.photoUrl;
    let photoId = user.photoId;

    // ✅ Si une nouvelle photo est uploadée
    if (req.file) {
      // Supprimer l'ancienne photo de Cloudinary
      if (user.photoId) {
        try {
          await cloudinary.uploader.destroy(user.photoId);
          console.log('✅ Ancienne photo supprimée de Cloudinary');
        } catch (error) {
          console.error('⚠️ Erreur suppression ancienne photo:', error);
        }
      }
      
      photoUrl = req.file.path;
      photoId = req.file.filename;
    }

    const updatedData = {
      nom,
      prenoms,
      contact,
      email,
      photoUrl,
      photoId,
      street: street || user.street,
      city: city || user.city,
      postalCode: postalCode || user.postalCode,
      country: country || user.country
    };
    
    if (password) updatedData.password = await bcrypt.hash(password, 10);

    await user.update(updatedData);
    
    // ✅ Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user.toJSON();
    res.json({ message: 'Profil mis à jour', user: userWithoutPassword });
  } catch (err) {
    console.error('Erreur updateProfile:', err);
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Changer mot de passe utilisateur connecté
// =====================
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Les deux champs sont obligatoires.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Récupérer utilisateurs par rôle
// =====================
exports.getUsersByRole = async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { role: req.params.role },
      attributes: { exclude: ['password'] } // ✅ Ne pas renvoyer les mots de passe
    });
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Réinitialiser mot de passe (oubli)
// =====================
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword } = req.body

    if (!identifier || !newPassword) {
      return res.status(400).json({ 
        error: 'Identifiant et nouveau mot de passe sont requis.' 
      })
    }

    // Cherche par email OU contact
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { contact: identifier }
        ]
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ message: 'Mot de passe réinitialisé avec succès' })

  } catch (err) {
    res.status(400).json({ error: err.message })
  }
};