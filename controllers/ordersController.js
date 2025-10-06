const { Order, Produit, OrderProducts, User } = require('../models/index');

// ➤ Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { userId, produits } = req.body;
    const order = await Order.create({ userId });

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

    res.status(201).json({ message: 'Commande créée', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Récupérer toutes les commandes
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user' },
        { model: Produit, as: 'produits', through: { attributes: ['quantite'] } },
      ],
    });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Récupérer les commandes d’un utilisateur
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.findAll({
      where: { userId },
      include: [
        { model: User, as: 'user' },
        { model: Produit, as: 'produits', through: { attributes: ['quantite'] } },
      ],
    });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Produit, as: 'produits', through: { attributes: ['quantite'] } },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Supprimer une commande
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    await OrderProducts.destroy({ where: { orderId: id } });
    await Order.destroy({ where: { id } });

    res.json({ message: 'Commande supprimée' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Mettre à jour le statut d’une commande
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.status = status;
    await order.save();

    res.json({ message: 'Statut de la commande mis à jour', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ➤ Mettre à jour les détails (produits) d’une commande
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
    res.status(400).json({ error: err.message });
  }
};

// ➤ Mettre à jour l’adresse de livraison
exports.updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    order.address = address;
    await order.save();

    res.json({ message: 'Adresse de livraison mise à jour', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
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
    res.status(400).json({ error: err.message });
  }
};

// statistiques des commandes et ventes
exports.getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalSales = await Order.sum('total');
    const ordersByStatus = await Order.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      group: ['status'],
    });

    res.json({ totalOrders, totalSales, ordersByStatus });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Rechercher des commandes par statut, date, utilisateur
exports.searchOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, userId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
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
    res.status(400).json({ error: err.message });
  }
}
