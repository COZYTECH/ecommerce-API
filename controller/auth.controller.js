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
import { redis } from "../util/redis.js";
import { v4 as uuidv4 } from "uuid";
import { ENV } from "../config/env.config.js";
import * as CartService from "../util/cartService.js";

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
  const sessionId = uuidv4();
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
    const accessToken = generateAccessToken(existingUser, sessionId);
    const refreshToken = await generateRefreshToken(existingUser, sessionId);

    await redis.set(
      `refresh:${existingUser._id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60 // 7 days
    );
    await redis.set(`access:${sessionId}`, "valid", {
      EX: 15 * 60, // 15 minutes
    });
    // existingUser.refreshToken = refreshToken;
    // await existingUser.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // const userCartKey = `cart:${existingUser._id}`;

    // if (guestCartKey) {
    //   const guestCart = await getCartFromRedis(guestCartKey);
    //   const userCart = await getCartFromRedis(userCartKey);

    //   const mergedItems = mergeCarts(guestCart, userCart);
    //   const mergedCart = { items: mergedItems };

    //   await saveCartToRedis(userCartKey, mergedCart);

    //   // Optionally, remove guest cart
    //   await clearCart(guestCartKey);
    // }
    // require cart middleware BEFORE this controller runs

    //const guestCartKey = req.cookies?.cartId;
    const guestCartKey = req.cookies?.cartId
      ? `cart:guest:${req.cookies.cartId}`
      : null;
    const userCartKey = `cart:user:${existingUser._id}`;
    let mergedCart = { items: [] };

    if (guestCartKey) {
      // 1. Get guest cart from Redis
      const guestCart = await CartService.getCartFromRedis(guestCartKey);

      // 2. Load user cart from Mongo to Redis
      await CartService.loadUserCartToRedis(existingUser._id);
      const userCart = await CartService.getCartFromRedis(userCartKey);

      // 3. Merge carts
      const mergedItems = CartService.mergeCartsItems(guestCart, userCart);
      const mergedCart = { items: mergedItems };

      // 4. Save merged cart to Redis & Mongo
      await CartService.saveCartToRedis(userCartKey, mergedCart);
      await CartService.persistCartToMongo(existingUser._id, mergedCart);

      // 5. Delete guest cart and cookie
      //await redis.del(`cart:guest:${guestCartKey}`);
      await redis.del(guestCartKey);

      res.clearCookie("cartId");
    }
    // **Update req.cartKey and cookie to user cart**
    req.cartKey = userCartKey;

    res.json({
      accessToken,
      user: {
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
      },
      cart: mergedCart,
      //cart: mergedCart || (await getCartFromRedis(`cart:${existingUser._id}`)),
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
    //const userId = payload.userId;
    const { userId, email, role } = payload;
    //const user = await User.findById(payload.userId).select("+refreshToken");
    //const user = await User.findById(payload.userId);
    // if (!user || user.refreshToken !== token)
    //   return res.status(403).json({ error: "Invalid refresh token" });
    const storedToken = await redis.get(`refresh:${userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // const accessToken = generateAccessToken(cser);
    // res.json({ accessToken });

    const newRefreshToken = await generateRefreshToken({
      _id: userId,
      email,
      role,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const newAccessToken = generateAccessToken(user);
    //const newAccessToken = generateAccessToken({ _id: userId });
    return res.json({ accessToken: newAccessToken });
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

// export const logout = async (req, res) => {
//   // const token = req.cookies.refreshToken;
//   // if (!token) return res.status(400).json({ error: "No token provided" });
//   // try {
//   //   const payload = verifyRefreshToken(token);
//   //   const user = await User.findById(payload.userId).select("+refreshToken");
//   //   if (!user || user.refreshToken !== token)
//   //     return res.status(403).json({ error: "Invalid refresh token" });
//   //   user.refreshToken = null;
//   //   await user.save();
//   //   res.clearCookie("refreshToken", {
//   //     httpOnly: true,
//   //     secure: process.env.NODE_ENV === "production",
//   //     sameSite: "Strict",
//   //   });
//   //   res.json({ success: true, message: "Logged out successfully" });
//   // } catch (err) {
//   //   console.error(err);
//   //   return res.status(500).json({ error: "Server error" });
//   // }

//   try {
//     // const token = req.token; // extracted from auth middleware
//     // const decoded = req.user; // user decoded

//     // // Blacklist access token
//     // await redis.set(`bl_${decoded.sessionId}`, "1", {
//     //   EX: decoded.exp - Math.floor(Date.now() / 1000),
//     // });

//     // // Remove refresh token
//     // await redis.del(`refresh:${decoded.userId}`);

//     // return res.json({ message: "Logged out successfully" });

//     const token = req.cookies.refreshToken;

//     if (token) {
//       try {
//         const payload = verifyRefreshToken(token);
//         await redis.del(`refresh:${payload.userId}`);
//       } catch (err) {
//         console.error("Error during logout:", err);
//       }
//     }

//     res.clearCookie("refreshToken");
//     res.json({ message: "Logged out successfully" });
//   } catch (err) {
//     res.status(500).json({ error: "Logout error" });
//   }
// };

// export const logout = async (req, res) => {
//   const token = req.cookies.refreshToken;

//   if (!token) {
//     return res
//       .status(200)
//       .json({ message: "No refresh token found, already logged out" });
//   }
//   try {
//     const payload = verifyRefreshToken(token); // await if async
//     if (payload && payload.userId) {
//       await redis.del(`refresh:${payload.userId.toString()}`);
//     }
//   } catch (err) {
//     console.error("Logout error:", err.message);
//   }

//   res.clearCookie("refreshToken", {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "Strict",
//   });

//   res.status(200).json({ message: "Logged out successfully" });
// };

// controller/auth.controller.js
export const logout = async (req, res) => {
  // Access token payload is available from verifyToken middleware
  const { sessionId, exp, userId } = req.user;

  // 1. Blacklist the access token
  const expiry = exp - Math.floor(Date.now() / 1000);
  if (expiry > 0) {
    await redis.set(`bl_${sessionId}`, "1", { EX: expiry });
  }

  // 2. Delete the refresh token
  await redis.del(`refresh:${userId}`);

  // 3. Clear the cookie
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};
