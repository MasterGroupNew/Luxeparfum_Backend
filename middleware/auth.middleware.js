const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware pour protéger les routes
module.exports = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;

      // Vérification du rôle
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      next(); // tout est OK
    } catch (err) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  };
};
