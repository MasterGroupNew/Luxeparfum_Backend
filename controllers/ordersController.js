const { Order, Produit, OrderProducts, User } = require('../models');

// ➤ Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingInfo } = req.body;
    const userId = req.user.id; // Récupéré depuis le middleware auth
    
    // Validation des données
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Aucun article dans la commande' });
    }

    if (!shippingInfo) {
      return res.status(400).json({ error: 'Informations de livraison manquantes' });
    }

    // Construire l'adresse complète
    const { ville, commune, pointRepere } = shippingInfo.adresseLivraison || {};
    const shippingAddress = `${commune || ''}, ${ville || ''}${pointRepere ? ', ' + pointRepere : ''}`.trim();

    // Créer les informations client en JSON
    const customerInfo = JSON.stringify({
      nom: shippingInfo.nom,
      prenom: shippingInfo.prenom,
      telephone: shippingInfo.telephone,
      email: shippingInfo.email
    });

    // Créer la commande principale
    const order = await Order.create({
      userId,
      total: 0,
      statut: 'en attente',
      shippingAddress,
      customerInfo,
      paymentMethod: shippingInfo.modePaiement
    });

    // Calculer le total et créer les OrderProducts
    let total = 0;
    for (const item of items) {
      const produit = await Produit.findByPk(item.id);
      
      if (!produit) {
        await OrderProducts.destroy({ where: { orderId: order.id } });
        await order.destroy();
        return res.status(404).json({ 
          error: `Produit avec l'ID ${item.id} non trouvé` 
        });
      }

      const itemTotal = produit.prix * item.quantity;
      total += itemTotal;

      await OrderProducts.create({
        orderId: order.id,
        produitId: item.id,
        quantite: item.quantity
      });
    }

    // Mettre à jour le total
    order.total = total;
    await order.save();

    res.status(201).json({ 
      message: 'Commande créée avec succès',
      orderId: order.id,
      order: {
        id: order.id,
        total: order.total,
        statut: order.statut,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      }
    });

  } catch (err) {
    console.error('Erreur création commande:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Récupérer toutes les commandes
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'nom', 'email']
        },
        { 
          model: Produit, 
          as: 'produits', 
          through: { attributes: ['quantite'] },
          attributes: ['id', 'nom', 'prix', 'image']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedOrders = orders.map(order => {
      const customerInfo = order.customerInfo ? JSON.parse(order.customerInfo) : {};
      
      return {
        id: order.id,
        userId: order.userId,
        user: order.user,
        total: order.total,
        status: order.statut,
        shippingAddress: order.shippingAddress,
        customerInfo,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.produits.map(produit => ({
          id: produit.id,
          name: produit.nom,
          price: produit.prix,
          image: produit.image,
          quantity: produit.OrderProducts.quantite
        }))
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error('Erreur récupération commandes:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Récupérer les commandes d'un utilisateur
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.findAll({
      where: { userId },
      include: [
        { 
          model: Produit, 
          as: 'produits', 
          through: { attributes: ['quantite'] },
          attributes: ['id', 'nom', 'prix', 'image']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedOrders = orders.map(order => {
      const customerInfo = order.customerInfo ? JSON.parse(order.customerInfo) : {};
      
      return {
        id: order.id,
        userId: order.userId,
        total: order.total,
        status: order.statut,
        shippingAddress: order.shippingAddress,
        customerInfo,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.produits.map(produit => ({
          id: produit.id,
          name: produit.nom,
          price: produit.prix,
          image: produit.image,
          quantity: produit.OrderProducts.quantite
        }))
      };
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error('Erreur récupération commandes:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: ['id', 'nom', 'email']
        },
        { 
          model: Produit, 
          as: 'produits', 
          through: { attributes: ['quantite'] },
          attributes: ['id', 'nom', 'prix', 'image']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const customerInfo = order.customerInfo ? JSON.parse(order.customerInfo) : {};
    
    const formattedOrder = {
      id: order.id,
      userId: order.userId,
      user: order.user,
      total: order.total,
      status: order.statut,
      shippingAddress: order.shippingAddress,
      customerInfo,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      items: order.produits.map(produit => ({
        id: produit.id,
        name: produit.nom,
        price: produit.prix,
        image: produit.image,
        quantity: produit.OrderProducts.quantite
      }))
    };

    res.json(formattedOrder);
  } catch (err) {
    console.error('Erreur récupération commande:', err);
    res.status(500).json({ error: err.message });
  }
};

// ➤ Supprimer une commande
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    await OrderProducts.destroy({ where: { orderId: id } });
    const deleted = await Order.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour le statut d'une commande
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.statut = status;
    await order.save();

    res.json({ message: 'Statut de la commande mis à jour', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour les détails (produits) d'une commande
exports.updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { produits } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    // Supprimer les anciens produits
    await OrderProducts.destroy({ where: { orderId: id } });

    // Recalculer le total
    let total = 0;
    for (const item of produits) {
      const produit = await Produit.findByPk(item.produitId);
      if (!produit) continue;

      total += produit.prix * item.quantite;
      await OrderProducts.create({
        orderId: order.id,
        produitId: item.produitId,
        quantite: item.quantite,
      });
    }

    order.total = total;
    await order.save();

    res.json({ message: 'Détails de la commande mis à jour', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour l'adresse de livraison
exports.updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.shippingAddress = address;
    await order.save();

    res.json({ message: 'Adresse de livraison mise à jour', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour le mode de paiement
exports.updateOrderPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.paymentMethod = paymentMethod;
    await order.save();

    res.json({ message: 'Mode de paiement mis à jour', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Mettre à jour le total (manuellement)
exports.updateOrderTotal = async (req, res) => {
  try {
    const { id } = req.params;
    const { total } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.total = total;
    await order.save();

    res.json({ message: 'Total de la commande mis à jour', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Statistiques des commandes et ventes
exports.getOrderStats = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    const totalOrders = await Order.count();
    const totalSales = await Order.sum('total');
    const ordersByStatus = await Order.findAll({
      attributes: [
        'statut', 
        [sequelize.fn('COUNT', sequelize.col('statut')), 'count']
      ],
      group: ['statut'],
    });

    res.json({ totalOrders, totalSales, ordersByStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ➤ Rechercher des commandes par statut, date, utilisateur
exports.searchOrders = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { status, startDate, endDate, userId } = req.query;
    const where = {};

    if (status) where.statut = status;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = { 
        [Op.between]: [new Date(startDate), new Date(endDate)] 
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'user' },
        { model: Produit, as: 'produits', through: { attributes: ['quantite'] } },
      ],
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};