import * as CartService from "../util/cartService.js";

export const viewCart = async (req, res) => {
  const cart = await CartService.getCartFromRedis(req.cartKey);
  return res.json({ success: true, cart });
};

export const addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: "productId required" });

  const cart = await CartService.addItemToCart(
    req.cartKey,
    productId,
    Number(qty)
  );
  console.log("Current Redis Cart Key:", req.cartKey);
  console.log("User ID:", req.user?.userId);

  res.json({ success: true, cart });
};

export const updateCart = async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || typeof qty === "undefined")
    return res.status(400).json({ error: "productId and qty required" });

  const cart = await CartService.updateItemQuantity(
    req.cartKey,
    productId,
    Number(qty)
  );
  res.json({ success: true, cart });
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const cart = await CartService.removeItemFromCart(req.cartKey, productId);
  res.json({ success: true, cart });
};

export const clearCartController = async (req, res) => {
  const cart = await CartService.clearCart(req.cartKey);
  res.json({ success: true, cart });
};
// export const mergeCarts = async (guestCartKey, userCartKey) => {
//   const guestCart = await CartService.getCartFromRedis(guestCartKey);
//   const userCart = await CartService.getCartFromRedis(userCartKey);
//     const mergedItems = CartService.mergeCartsItems(guestCart, userCart);
//     const mergedCart = { items: mergedItems };
//     await CartService.saveCartToRedis(userCartKey, mergedCart);
//     await CartService.clearCart(guestCartKey);
//     return mergedCart;
// }
// export const generateGuestCartKey = (res) => {
//   const guestCartId = uuidv4();
//   const
//     cookieName = ENV.CART_COOKIE_NAME;
//   res.cookie(cookieName, guestCartId, {
//     httpOnly: true,
//     maxAge: 30 * 24 * 60 * 60 * 1000,
//   });
//   return `cart:guest:${guestCartId}`;
// };
// export const getCartKeyFromCookie = (req) => {
//   const cookieName = ENV.CART_COOKIE_NAME;
//   const guestCartId = req.cookies[cookieName];
//     return `cart:guest:${guestCartId}`;
// };
