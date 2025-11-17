import jwt from "jsonwebtoken";
import { ENV } from "../config/env.config.js";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../util/redis.js";
export const generateAccessToken = (user) => {
  const sessionId = uuidv4();
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role, sessionId },
    ENV.JWT_SECRET,
    { expiresIn: "15m" } // short-lived access token
  );
};

export const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
    // long-lived refresh token
  );
  //ioride method
  // await redis.set(`refresh:${user._id}`, refreshToken, "EX", 7 * 24 * 60 * 60)
  await redis.set(`refresh:${user._id}`, refreshToken, {
    EX: 7 * 24 * 60 * 60, // 7 days
  });

  return refreshToken;
};

export const verifyAccessToken = (token) => jwt.verify(token, ENV.JWT_SECRET);
export const verifyRefreshToken = (token) =>
  jwt.verify(token, ENV.JWT_REFRESH_SECRET);
