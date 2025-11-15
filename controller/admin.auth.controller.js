import {
  loginSchema,
  superAdminSchema,
} from "../middleware/schema.validation.js";
import Admin from "../models/Admin.model.js";
import doHash from "../lib/hash.js";
import { doHashValidation } from "../lib/hash.js";
import { generateAccessToken } from "../lib/jwt.js";
import { generateRefreshToken } from "../lib/jwt.js";

export const superAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  const { error } = superAdminSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const existingSuperAdmin = await Admin.findOne({ email });
    if (existingSuperAdmin) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const existingUsername = await Admin.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }
    const hashedPassword = await doHash(password, 10); // Replace with actual hashing logic
    const superAdmin = new Admin({
      username,
      email,
      password: hashedPassword,
    });
    const result = await superAdmin.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "SuperAdmin created successfully",
      result,
      role: Admin.role,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const existingSuperAdmin = await Admin.findOne({ email }).select("+password");
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

  const accessToken = generateAccessToken(existingSuperAdmin);
  const refreshToken = generateRefreshToken(existingSuperAdmin);

  existingSuperAdmin.refreshToken = refreshToken;
  await existingSuperAdmin.save();

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
      role: Admin.role,
    },
  });
};
