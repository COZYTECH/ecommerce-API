import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded; // Attach the decoded payload to req.user
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
