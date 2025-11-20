import express from "express";
import { cartKeyMiddleware } from "../middleware/cartKeyMiddleware.js";
import {
  addToCart,
  clearCartController,
  removeFromCart,
  updateCart,
  viewCart,
} from "../controller/cart.controller.js";
import authorizeRoles from "../middleware/admin.verification.js";
import { verifyToken } from "../middleware/verify.token.js";

const router = express.Router();

// router.get(
//   "/view-cart",
//   verifyToken,
//   authorizeRoles("user", "admin"),
//   cartKeyMiddleware,
//   viewCart
// );
// router.post(
//   "/add-cart",
//   verifyToken,
//   authorizeRoles("user", "admin"),
//   cartKeyMiddleware,
//   addToCart
// );
// router.put("/update-cart", updateCart);
// router.delete("/remove-from-cart/:id", removeFromCart);
// router.post("/clear-cart", clearCartController);

router.post("/add-cart", cartKeyMiddleware, addToCart);
router.put("/update-cart", cartKeyMiddleware, updateCart);
router.delete("/remove-from-cart/:id", cartKeyMiddleware, removeFromCart);
router.post("/clear-cart", cartKeyMiddleware, clearCartController);

router.use(verifyToken);
router.use(authorizeRoles("user", "admin"));

router.get("/view-cart", cartKeyMiddleware, viewCart);
router.post("/add-cart-auth", cartKeyMiddleware, addToCart);

export default router;
