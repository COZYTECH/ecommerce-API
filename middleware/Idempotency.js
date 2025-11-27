// middleware/idempotency.js
import { v4 as uuidv4 } from "uuid";
import { redis } from "../util/redis.js";

export const idempotencyMiddleware = async (req, res, next) => {
  try {
    // Use frontend-provided key or auto-generate
    const key = req.headers["idempotency-key"] || uuidv4();

    // Attach the key to the request for later use
    req.idempotencyKey = `order:${key}`;

    // Check Redis if this key already exists
    const exists = await redis.get(req.idempotencyKey);
    if (exists) {
      return res
        .status(409)
        .json({ message: "This request has already been processed" });
    }

    next();
  } catch (err) {
    console.error("Idempotency Middleware Error:", err);
    res.status(500).json({ error: "Server error in idempotency check" });
  }
};
