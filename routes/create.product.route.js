import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../controller/product.controller.js";
import authorizeRoles from "../middleware/admin.verification.js";
import { verifyToken } from "../middleware/verify.token.js";
import upload from "../middleware/multer.js";
import { addReview } from "../controller/review.controller.js";

const router = express.Router();
router.get("/get-products", verifyToken, getProducts);
router.post(
  "/create-product",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  upload.array("images", 10),
  createProduct
);

router.get("/get-productsbyId/:id", verifyToken, getProductById);
router.put(
  "/update-product/:id",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  upload.array("images", 10),
  updateProduct
);
router.post("/:productId/review", verifyToken, addReview);

router.delete(
  "/delete-product/:id",
  verifyToken,
  authorizeRoles("superadmin", "admin"),
  deleteProduct
);
export default router;
