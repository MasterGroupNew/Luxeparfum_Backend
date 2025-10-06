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

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// Rendre le dossier uploads accessible publiquement
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', panierRoutes);
app.use('/api/categories', categoryRoutes);

// Démarrage du serveur et synchronisation des modèles
const PORT = process.env.PORT || 2025;
console.log('Initialisation des modèles...');
initializeModels().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur le port ${PORT}`);
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  });
}).catch(err => {
  console.error('Erreur lors de l\'initialisation des modèles :', err);
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur attrapée par le middleware global :', err);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});