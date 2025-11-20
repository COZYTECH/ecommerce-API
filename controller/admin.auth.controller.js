import {
  loginSchema,
  superAdminSchema,
} from "../middleware/schema.validation.js";
import Admin from "../models/Admin.model.js";
import doHash from "../lib/hash.js";
import { doHashValidation } from "../lib/hash.js";
import { generateAccessToken } from "../lib/jwt.js";
import { generateRefreshToken } from "../lib/jwt.js";
import User from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../util/redis.js";

export const createAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  const { error } = superAdminSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingSuperAdmin = await User.findOne({ email });
    if (existingSuperAdmin) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }
    const hashedPassword = await doHash(password, 10); // Replace with actual hashing logic
    const superAdmin = new User({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });
    const result = await superAdmin.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      result,
      role: result.role,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const sessionId = uuidv4();
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const existingSuperAdmin = await User.findOne({ email }).select(
    "+password +role"
  );
  if (!existingSuperAdmin) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = await doHashValidation(
    password,
    existingSuperAdmin.password
  );
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  console.log("Logging in user role:", User.role);
  console.log(User);

  if (!["admin", "superadmin"].includes(existingSuperAdmin.role)) {
    return res
      .status(403)
      .json({ message: "You are not allowed to login here" });
  }

  const accessToken = generateAccessToken(existingSuperAdmin, sessionId);
  const refreshToken = await generateRefreshToken(
    existingSuperAdmin,
    sessionId
  );
  await redis.set(
    `refresh:${existingSuperAdmin._id}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60 // 7 days
  );
  await redis.set(`access:${sessionId}`, "valid", {
    EX: 15 * 60, // 15 minutes
  });

  // existingSuperAdmin.refreshToken = refreshToken;
  // await existingSuperAdmin.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    accessToken,
    superUser: {
      email: existingSuperAdmin.email,
      role: existingSuperAdmin.role,
    },
  });
};
