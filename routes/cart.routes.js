const express = require('express');
const router = express.Router();
const cartCtrl = require('../controllers/cartController');
const auth = require('../middleware/auth.middleware');

router.post('/add', auth, cartCtrl.addToCart);
router.get('/get', auth, cartCtrl.getCart);
router.post('/sync', auth, cartCtrl.syncCartFromLocalStorage);
router.delete('/remove/:productId', auth, cartCtrl.removeFromCart);


module.exports = router;
