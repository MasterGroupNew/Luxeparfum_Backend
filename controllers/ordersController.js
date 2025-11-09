const { Order, Produit, OrderProducts, User } = require('../models');

// ➤ Créer une commande
exports.createOrder = async (req, res) => {
  console.log('========== DÉBUT CREATE ORDER ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User from middleware:', req.user);
  console.log('Body reçu:', JSON.stringify(req.body, null, 2));

  try {
    // Étape 1: Récupération des données
    console.log('--- Étape 1: Récupération des données ---');
    const { items, shippingInfo } = req.body;
    const userId = req.user?.id;
    
    console.log('userId:', userId);
    console.log('items count:', items?.length);
    console.log('shippingInfo:', shippingInfo);

    // Validation des données
    console.log('--- Étape 2: Validation ---');
    if (!userId) {
      console.error('❌ userId manquant');
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Items invalides');
      return res.status(400).json({ error: 'Aucun article dans la commande' });
    }

    if (!shippingInfo) {
      console.error('❌ shippingInfo manquant');
      return res.status(400).json({ error: 'Informations de livraison manquantes' });
    }

    console.log('✅ Validation OK');

    // Construire l'adresse complète
    console.log('--- Étape 3: Préparation des données ---');
    const { ville, commune, pointRepere } = shippingInfo.adresseLivraison || {};
    const shippingAddress = `${commune || ''}, ${ville || ''}${pointRepere ? ', ' + pointRepere : ''}`.trim();

    console.log('shippingAddress construit:', shippingAddress);

    // Créer les informations client en JSON
    const customerInfo = JSON.stringify({
      nom: shippingInfo.nom,
      prenom: shippingInfo.prenom,
      telephone: shippingInfo.telephone,
      email: shippingInfo.email
    });

    console.log('customerInfo construit:', customerInfo);
    console.log('paymentMethod:', shippingInfo.modePaiement);

    // Créer la commande principale
    console.log('--- Étape 4: Création de la commande ---');
    console.log('Données à insérer:', {
      userId,
      total: 0,
      statut: 'en attente',
      shippingAddress,
      customerInfo,
      paymentMethod: shippingInfo.modePaiement
    });

    const order = await Order.create({
      userId,
      total: 0,
      statut: 'en attente',
      shippingAddress,
      customerInfo,
      paymentMethod: shippingInfo.modePaiement
    });

    console.log('✅ Commande créée avec ID:', order.id);

    // Calculer le total et créer les OrderProducts
    console.log('--- Étape 5: Ajout des produits ---');
    let total = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\nTraitement produit ${i + 1}/${items.length}:`, item);
      
      const produit = await Produit.findByPk(item.id);
      console.log('Produit trouvé:', produit ? `${produit.nom} - ${produit.prix} FCFA` : 'NON TROUVÉ');
      
      if (!produit) {
        console.error(`❌ Produit ${item.id} non trouvé, annulation de la commande...`);
        await OrderProducts.destroy({ where: { orderId: order.id } });
        await order.destroy();
        return res.status(404).json({ 
          error: `Produit avec l'ID ${item.id} non trouvé` 
        });
      }

      const itemTotal = produit.prix * item.quantity;
      total += itemTotal;
      console.log(`Prix unitaire: ${produit.prix}, Quantité: ${item.quantity}, Sous-total: ${itemTotal}`);

      console.log('Création OrderProduct...');
      const orderProduct = await OrderProducts.create({
        orderId: order.id,
        produitId: item.id,
        quantite: item.quantity
      });
      console.log('✅ OrderProduct créé, ID:', orderProduct.id);
    }

    console.log(`\n--- Étape 6: Mise à jour du total ---`);
    console.log('Total calculé:', total);
    order.total = total;
    await order.save();
    console.log('✅ Total mis à jour');

    // Réponse de succès
    console.log('--- Étape 7: Envoi de la réponse ---');
    const response = { 
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
    };
    console.log('Réponse à envoyer:', JSON.stringify(response, null, 2));
    
    console.log('✅ ========== FIN CREATE ORDER (SUCCESS) ==========\n');
    return res.status(201).json(response);

  } catch (err) {
    console.error('========== ERREUR CREATE ORDER ==========');
    console.error('Type d\'erreur:', err.name);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    
    if (err.original) {
      console.error('Erreur SQL originale:', err.original);
    }
    
    console.error('========== FIN ERREUR ==========\n');
    
    return res.status(500).json({ 
      error: err.message,
      type: err.name
    });
  }
};

// Reste du code inchangé...
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

exports.updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { produits } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    await OrderProducts.destroy({ where: { orderId: id } });

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