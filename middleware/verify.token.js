import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";
import { redis } from "../util/redis.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    //const isBlacklisted = await redis.get(`bl_${decoded.sessionId}`);
    await redis.set(`bl_${decoded.sessionId}`, "1", {
      EX: 15 * 60, // match access token TTL
    });
    if (isBlacklisted) {
      return res.status(401).json({ error: "Token is invalid (logged out)" });
    }
    req.user = decoded; // Attach the decoded payload to req.user
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
