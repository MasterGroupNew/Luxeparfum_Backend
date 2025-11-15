const { Cart, CartProduct, Produit, Category } = require('../models/index');

// ➕ Ajouter un produit au panier
exports.addToCart = async (req, res) => {
  try {
    const user = req.user;
    const { produitId, quantity } = req.body;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    // Cherche le panier de l'utilisateur
    let cart = await Cart.findOne({ where: { userId: user.id } });

    if (!cart) {
      cart = await Cart.create({ userId: user.id });
    }

    // Vérifie si le produit est déjà dans le panier
    let item = await CartProduct.findOne({
      where: { cartId: cart.id, produitId }
    });

    if (item) {
      item.quantity += quantity;
      await item.save();
    } else {
      await CartProduct.create({
        cartId: cart.id,
        produitId,
        quantity: quantity
      });
    }
    res.status(200).json({ message: "Produit ajouté au panier" });
  } catch (error) {
    console.error("Erreur panier:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🛒 Obtenir les produits du panier
exports.getCart = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Trouver le panier de l'utilisateur avec la bonne association
    const cart = await Cart.findOne({
      where: { userId: user.id },
      include: [
        {
          model: Produit,  // ✅ Directement Produit via belongsToMany
          as: 'produits',  // ✅ L'alias défini dans Cart.belongsToMany
          through: { 
            attributes: ['quantity', 'id'] 
          },
          attributes: ['id', 'nom', 'prix', 'imagePath'],
          include: [
            {
              model: Category,
              as: 'categorie',
              attributes: ['id', 'nom']
            }
          ]
        }
      ]
    });

    if (!cart) {
      return res.status(200).json({ 
        cart: { 
          id: null,
          produits: [] 
        } 
      });
    }

    // Formater les données pour le frontend
    const formattedCart = {
      id: cart.id,
      userId: cart.userId,
      produits: cart.produits.map(produit => ({
        id: produit.id,
        name: produit.nom,
        price: produit.prix,
        image: produit.imagePath,
        quantity: produit.CartProduct.quantity, // ✅ Via la table de liaison
        categorie: produit.categorie?.nom || 'Non catégorisé'
      }))
    };

    res.status(200).json({ cart: formattedCart });
  } catch (error) {
    console.error("Erreur lecture panier:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔄 Synchroniser les produits du localStorage au backend
// 🔄 Synchroniser les produits du localStorage au backend
exports.syncCartFromLocalStorage = async (req, res) => {
  try {
    const user = req.user;
    const { produits } = req.body;

    console.log('=== SYNC CART ===');
    console.log('User:', user.id);
    console.log('Produits reçus:', JSON.stringify(produits, null, 2));

    if (!user || !Array.isArray(produits)) {
      return res.status(400).json({ error: "Requête invalide" });
    }

    // Validation des produits
    if (produits.length === 0) {
      return res.status(200).json({ message: "Aucun produit à synchroniser" });
    }

    let cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) {
      cart = await Cart.create({ userId: user.id });
    }

    for (const item of produits) {
      // ✅ CORRECTION: Le frontend envoie probablement "id" et non "produitId"
      const produitId = item.id || item.produitId;
      const quantity = item.quantity || item.quantite || 1;

      console.log(`Processing: produitId=${produitId}, quantity=${quantity}`);

      if (!produitId) {
        console.error('produitId manquant pour:', item);
        continue; // Passer au suivant si pas d'ID
      }

      const exist = await CartProduct.findOne({
        where: { 
          cartId: cart.id, 
          produitId: produitId  // ✅ Utiliser la variable, pas item.id
        }
      });

      if (exist) {
        exist.quantity += quantity;
        await exist.save();
        console.log(`Updated: ${produitId}, nouvelle quantité: ${exist.quantity}`);
      } else {
        await CartProduct.create({
          cartId: cart.id,
          produitId: produitId,  // ✅ Utiliser la variable
          quantity: quantity
        });
        console.log(`Created: ${produitId}, quantité: ${quantity}`);
      }
    }

    res.status(200).json({ message: "Panier synchronisé avec succès" });
  } catch (error) {
    console.error("Erreur sync panier:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔄 Mettre à jour la quantité
exports.updateCartItem = async (req, res) => {
  try {
    const user = req.user;
    const { produitId } = req.params;
    const { quantity } = req.body;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) return res.status(404).json({ error: 'Panier non trouvé' });

    const item = await CartProduct.findOne({
      where: { cartId: cart.id, produitId }
    });

    if (!item) return res.status(404).json({ error: 'Produit non trouvé dans le panier' });

    if (quantity <= 0) {
      await item.destroy();
    } else {
      item.quantity = quantity;
      await item.save();
    }

    res.json({ message: 'Quantité mise à jour' });
  } catch (error) {
    console.error("Erreur mise à jour panier:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Supprimer un produit du panier
exports.removeFromCart = async (req, res) => {
  try {
    const user = req.user;
    const { produitId } = req.params;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) return res.status(404).json({ error: 'Panier non trouvé' });

    const item = await CartProduct.findOne({
      where: { cartId: cart.id, produitId }
    });

    if (!item) return res.status(404).json({ error: 'Produit non trouvé dans le panier' });

    await item.destroy();
    res.json({ message: 'Produit supprimé du panier' });
  } catch (error) {
    console.error("Erreur suppression panier:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Vider le panier
exports.clearCart = async (req, res) => {
  try {
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'Non autorisé' });

    const cart = await Cart.findOne({ where: { userId: user.id } });
    if (!cart) return res.status(404).json({ error: 'Panier non trouvé' });

    await CartProduct.destroy({ where: { cartId: cart.id } });

    res.json({ message: 'Panier vidé avec succès' });
  } catch (error) {
    console.error("Erreur vidage panier:", error);
    res.status(500).json({ error: error.message });
  }
};