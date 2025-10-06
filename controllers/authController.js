const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { Op } = require('sequelize');

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenoms,
      contact,
      email,
      password: hashedPassword,
      role: role || 'user',
      photoUrl: req.file ? req.file.path : null,
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      nom,
      prenoms,
      contact,
      email,
      password: hashedPassword,
      role,
      photoUrl: req.file ? req.file.path : null,
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
    const users = await User.findAll();
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
    const user = await User.findByPk(req.params.id);
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

    const updatedData = {
      nom,
      prenoms,
      contact,
      email,
      role,
      photoUrl: req.file ? req.file.path : user.photoUrl,
      street: street || user.street,
      city: city || user.city,
      postalCode: postalCode || user.postalCode,
      country: country || user.country
    };
    if (password) updatedData.password = await bcrypt.hash(password, 10);

    await user.update(updatedData);
    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Supprimer un utilisateur
// =====================
exports.deleteUser = async (req, res) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =====================
// Récupérer le profil utilisateur connecté
// =====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
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
    const updatedData = {
      nom,
      prenoms,
      contact,
      email,
      photoUrl: req.file ? req.file.path : user.photoUrl,
      street: street || user.street,
      city: city || user.city,
      postalCode: postalCode || user.postalCode,
      country: country || user.country
    };
    if (password) updatedData.password = await bcrypt.hash(password, 10);

    await user.update(updatedData);
    res.json({ message: 'Profil mis à jour', user });
  } catch (err) {
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
    const users = await User.findAll({ where: { role: req.params.role } });
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
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email et nouveau mot de passe requis.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
