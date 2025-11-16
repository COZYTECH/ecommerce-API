import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    ENV.JWT_SECRET,
    { expiresIn: "15m" } // short-lived access token
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // long-lived refresh token
  );
};

export const verifyAccessToken = (token) => jwt.verify(token, ENV.JWT_SECRET);
export const verifyRefreshToken = (token) =>
  jwt.verify(token, ENV.JWT_REFRESH_SECRET);
