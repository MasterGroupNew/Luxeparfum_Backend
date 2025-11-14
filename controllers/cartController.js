const { Cart, CartProduct, Product } = require('../models/index');

// ➕ Ajouter un produit au panier (uniquement pour utilisateur connecté)
exports.addToCart = async (req, res) => {
  try {
    const user = req.user; // injecté par le middleware auth
    const { productId, quantity } = req.body;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // Cherche le panier de l'utilisateur
    let cart = await Cart.findOne({ where: {   userId: user.id } });

    if (!cart) {
      cart = await Cart.create({   userId: user.id });
    }

    // Vérifie si le produit est déjà dans le panier
    let item = await CartProduct.findOne({
      where: { cartId: cart.id, productId }
    });

    if (item) {
      item.quantity += quantity;
      await item.save();
    } else {
      await CartProduct.create({
        cartId: cart.id,
        productId,
        quantity
      });
    }
    res.status(200).json({ message: "Produit ajouté au panier" });
  } catch (error) {
    console.error("Erreur panier:", error);
    res.status(500).send("Erreur serveur");
  }
};

// 🛒 Obtenir les produits du panier pour un utilisateur connecté
exports.getCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const cart = await Cart.findOne({
      where: {   userId: user.id },
      include: {
        model: Product,
        through: { attributes: ['quantity'] }
      }
    });

    if (!cart) return res.json({ produits: [] });

    res.json(cart.Products);
  } catch (error) {
    console.error("Erreur lecture panier:", error);
    res.status(500).send("Erreur serveur");
  }
};

// 🔄 Synchroniser les produits du localStorage au backend
exports.syncCartFromLocalStorage = async (req, res) => {
  try {
    const user = req.user;
    const { produits } = req.body;

    if (!user || !Array.isArray(produits)) {
      return res.status(400).json({ error: "Requête invalide" });
    }

    let cart = await Cart.findOne({ where: {   userId: user.id } });
    if (!cart) {
      cart = await Cart.create({   userId: user.id });
    }

    for (const item of produits) {
      const { produitId, quantite } = item;

      const exist = await CartProduct.findOne({
        where: { cartId: cart.id, productId: produitId }
      });

      if (exist) {
        exist.quantity += quantite;
        await exist.save();
      } else {
        await CartProduct.create({
          cartId: cart.id,
          productId: produitId,
          quantity: quantite
        });
      }
    }

    res.status(200).json({ message: "Panier synchronisé avec succès" });
  } catch (error) {
    console.error("Erreur sync panier:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
// 🗑️ Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.params;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const cart = await Cart.findOne({ where: {   userId: user.id } });
    if (!cart) return res.status(404).json({ error: 'Panier non trouvé' });

    const item = await CartProduct.findOne({
      where: { cartId: cart.id, productId }
    });

    if (!item) return res.status(404).json({ error: 'Produit non trouvé dans le panier' });

    await item.destroy();
    res.json({ message: 'Produit supprimé du panier' });
  } catch (error) {
    console.error("Erreur suppression panier:", error);
    res.status(500).send("Erreur serveur");
  }
};