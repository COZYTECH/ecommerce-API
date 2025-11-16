import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../middleware/schema.validation.js";
import User from "../models/user.model.js";
import doHash from "../lib/hash.js";
import { doHashValidation } from "../lib/hash.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";
import { verifyAccessToken, verifyRefreshToken } from "../lib/jwt.js";

export const register = async (req, res) => {
  // Registration logic here

  const { username, email, password, address } = req.body;
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  //  Remove role if attacker sends it
  if (req.body.role) delete req.body.role;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }
    // hashing the user password
    const hashedPassword = await doHash(password, 10); // Replace with actual hashing logic
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      address,
    });
    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "user created successfully",
      result,
      role: User.role,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const Login = async (req, res) => {
  // Login logic here
  const { email, password } = req.body;
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (req.body.role) delete req.body.role;
  try {
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const isPasswordValid = await doHashValidation(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    //existingUser.password = undefined;
    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        email: existingUser.email,
        username: existingUser.username,
        role: User.role,
      },
    });

    // const token = jwt.sign(
    //   {
    //     userId: existingUser._id,
    //     email: existingUser.email,
    //   },
    //   process.env.TOKEN_KEY,
    //   { expiresIn: "8h" }
    // );
    // res
    //   .cookie("Authorization", "Bearer" + token, {
    //     expires: new Date(Date.now() + 8 * 3600000),
    //     httpOnly: process.env.NODE_ENV === "production",
    //     secure: process.env.NODE_ENV === "production",
    //   })
    //   .json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId).select("+refreshToken");
    //const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== token)
      return res.status(403).json({ error: "Invalid refresh token" });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

export const changePassword = async (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const existingUser = await User.findById(userId).select("+password");
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const isOldPasswordValid = await doHashValidation(
      oldPassword,
      existingUser.password
    );
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    const hashedNewPassword = await doHash(newPassword, 10);
    existingUser.password = hashedNewPassword;
    await existingUser.save();
    res.json({
      success: true,
      message: "Password changed successfully",
      role: User.role,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
