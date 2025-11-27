// routes/orders.js
import express from "express";
// import { createOrder, captureOrder } from "../controller/order.controller.js";
import { createOrder, captureOrder } from "../controller/order.controller.js";
import { idempotencyMiddleware } from "../middleware/Idempotency.js";
import { verifyToken } from "../middleware/verify.token.js";

const router = express.Router();

router.post("/create-order", verifyToken, idempotencyMiddleware, createOrder);
router.post("/capture-order", verifyToken, idempotencyMiddleware, captureOrder);

export default router;
