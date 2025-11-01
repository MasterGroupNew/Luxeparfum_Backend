// 📦 config/upload.js
require('dotenv').config();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 🧩 Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// ✅ Vérification des variables d'environnement
if (!process.env.CLOUD_NAME || !process.env.CLOUD_KEY || !process.env.CLOUD_SECRET) {
  console.error('⚠️ ERREUR: Variables Cloudinary manquantes dans .env');
  throw new Error('Configuration Cloudinary incomplète');
} else {
  console.log('✅ Cloudinary configuré avec succès');
}

// 🗂️ Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'luxeparfum/products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `product-${uniqueSuffix}`;
    },
  },
});

// 🧠 Filtre de fichiers
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('⚠️ Seules les images sont autorisées (jpg, png, jpeg, gif, webp)'), false);
};

// 🚀 Middleware Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = { upload, cloudinary };
