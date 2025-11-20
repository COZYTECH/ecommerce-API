import { v4 as uuidv4 } from "uuid";
import { ENV } from "../config/env.config";
export const cartKeyMiddleware = (req, res, next) => {
  // If user is logged in, prefer user cart key
  if (req.user && req.user.userId) {
    req.cartKey = `cart:user:${req.user.userId}`;
    return next();
  }
  // Guest: ensure a cookie cartId exists
  const cookieName = ENV.CART_COOKIE_NAME;
  let guestCartId = req.cookies[cookieName];
  if (!guestCartId) {
    guestCartId = uuidv4();
    // cookie lasts 30 days
    res.cookie(cookieName, guestCartId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  req.cartKey = `cart:guest:${guestCartId}`;
  next();
};
