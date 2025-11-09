const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const auth = require('../middleware/auth.middleware');

// ➤ Créer une commande
router.post('/add_order', auth(), ordersController.createOrder);

// ➤ Récupérer toutes les commandes
router.get('/get_orders', auth(), ordersController.getOrders);

// ➤ Récupérer les commandes d’un utilisateur
router.get('/user/:userId', auth(), ordersController.getOrdersByUser);

// ➤ Supprimer une commande
router.delete('/delete_order/:id', auth(), ordersController.deleteOrder);

// ➤ Mettre à jour le statut d’une commande (admin uniquement)
router.put('/update_order_status/:id', auth(['admin']), ordersController.updateOrderStatus);

// ➤ Mettre à jour les détails (produits)
router.put('/update_order_details/:id', auth(['admin']), ordersController.updateOrderDetails);

// ➤ Mettre à jour l’adresse
router.put('/update_order_address/:id', auth(['admin']), ordersController.updateOrderAddress);

// ➤ Mettre à jour le mode de paiement
router.put('/update_order_payment/:id', auth(['admin']), ordersController.updateOrderPaymentMethod);

// ➤ Mettre à jour le total
router.put('/update_order_total/:id', auth(['admin']), ordersController.updateOrderTotal);

// ➤ Récupérer une commande par ID
router.get('/get_order/:id', auth(), ordersController.getOrderById);

module.exports = router;
