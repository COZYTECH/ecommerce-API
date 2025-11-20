import { redis } from "../util/redis.js";
import Cart from "../models/cart.model.js";

export const getCartFromRedis = async (key) => {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : { items: [] };
};

export const saveCartToRedis = async (key, cart) => {
  await redis.set(key, JSON.stringify(cart), { EX: 60 * 60 * 24 });
};

export const addItemToCart = async (key, productId, qty = 1) => {
  const cart = await getCartFromRedis(key);
  const idxCart = cart.items.findIndex(
    (i) => String(i.productId) === String(productId)
  );
  if (idxCart !== -1) cart.items[idxCart].quantity += qty;
  else cart.items.push({ productId, quantity: qty });
  await saveCartToRedis(key, cart);
  return cart;
};

export const updateItemQuantity = async (key, productId, qty) => {
  const cart = await getCartFromRedis(key);
  const idxCart = cart.items.findIndex((i) => i.productId === productId);
  if (idxCart === -1) return cart;
  cart.items[idxCart].quantity = qty;
  if (cart.items[idxCart].quantity <= 0) cart.items.splice(idxCart, 1);
  await saveCartToRedis(key, cart);
  return cart;
};

export const removeItemFromCart = async (key, productId) => {
  const cart = await getCartFromRedis(key);
  cart.items = cart.items.filter((i) => i.productId !== productId);
  await saveCartToRedis(key, cart);
  return cart;
};

export const clearCart = async (key) => {
  const cart = { items: [] };
  await saveCartToRedis(key, cart);
  return cart;
};

export const mergeCartsItems = (guestCart, userCart) => {
  const map = new Map();
  // add user items first
  (userCart.items || []).forEach((i) =>
    map.set(String(i.productId), {
      productId: String(i.productId),
      quantity: i.quantity,
    })
  );
  // merge guest
  (guestCart.items || []).forEach((i) => {
    const mergeGuest = String(i.productId);
    if (map.has(mergeGuest)) map.get(mergeGuest).quantity += i.quantity;
    else map.set(mergeGuest, { productId: mergeGuest, quantity: i.quantity });
  });
  return Array.from(map.values());
};

export const persistCartToMongo = async (userId, cart) => {
  let existing = await Cart.findOne({ userId });
  if (!existing) {
    existing = new Cart({ userId, items: [] });
  }

  const map = new Map();
  // Add existing items first
  (existing.items || []).forEach((i) =>
    map.set(String(i.productId), {
      productId: String(i.productId),
      quantity: i.quantity,
    })
  );

  // Merge new cart items
  (cart.items || []).forEach((i) => {
    const id = String(i.productId);
    if (map.has(id)) {
      map.get(id).quantity += i.quantity;
    } else {
      map.set(id, { productId: id, quantity: i.quantity });
    }
  });

  existing.items = Array.from(map.values());
  await existing.save();
  return existing;
};

export const loadUserCartToRedis = async (userId) => {
  const doc = await Cart.findOne({ userId });
  const key = `cart:user:${userId}`;
  const cart = doc
    ? {
        items: doc.items.map((i) => ({
          productId: String(i.productId),
          quantity: i.quantity,
        })),
      }
    : { items: [] };
  await saveCartToRedis(key, cart);
  return cart;
};
