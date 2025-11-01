require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const initializeModels = require('./models/index').initializeModels;

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const ordersRoutes = require('./routes/orders.route');
const panierRoutes = require('./routes/cart.routes');
const categoryRoutes = require('./routes/category.route');

const app = express();

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser avec limite augmentée pour les images
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de log (avant tout)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware pour répondre aux requêtes OPTIONS (préflight CORS)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS préflight reçue pour', req.url);
    return res.sendStatus(204);
  }
  next();
});

// Route de test à la racine
app.get('/', (req, res) => {
  res.json({ 
    message: '🌸 API Luxe Parfum - Bienvenue', 
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      cart: '/api/cart',
      categories: '/api/categories'
    }
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', panierRoutes);
app.use('/api/categories', categoryRoutes);

// Route 404 - DOIT ÊTRE APRÈS toutes les routes définies
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de gestion des erreurs (DOIT ÊTRE LE DERNIER)
app.use((err, req, res, next) => {
  console.error('❌ Erreur attrapée par le middleware global :', err);
  
  // Gestion des erreurs Multer (upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Fichier trop volumineux. Taille maximale: 5MB' 
      });
    }
    return res.status(400).json({ 
      error: `Erreur d'upload: ${err.message}` 
    });
  }
  
  // Erreur générique
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Démarrage du serveur et synchronisation des modèles
const PORT = process.env.PORT || 2025;

console.log('🔄 Initialisation des modèles Sequelize...');

initializeModels()
  .then(() => {
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('✅ Serveur démarré avec succès !');
      console.log(`🚀 Port: ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`☁️  Cloudinary: ${process.env.CLOUD_NAME ? '✅ Configuré' : '❌ Non configuré'}`);
      console.log('='.repeat(50));
    });
  })
  .catch(err => {
    console.error('❌ Erreur lors de l\'initialisation des modèles :', err);
    process.exit(1);
  });

// Gestion de l'arrêt gracieux du serveur
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM reçu. Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT reçu. Arrêt du serveur...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('❌ Erreur non capturée:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejetée non gérée:', reason);
  process.exit(1);
});

module.exports = app;