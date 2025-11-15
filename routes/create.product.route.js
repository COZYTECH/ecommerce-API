import express from "express";
import { createProduct } from "../controller/product.controller.js";
import authorizeRoles from "../middleware/admin.verification.js";
import { verifyToken } from "../middleware/verify.token.js";

const router = express.Router();
router.post("/create-product", verifyToken, authorizeRoles, createProduct);
export default router;
