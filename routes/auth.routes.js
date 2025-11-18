import express from "express";
import {
  Login,
  register,
  refresh,
  changePassword,
  logout,
} from "../controller/auth.controller.js";
import { verifyToken } from "../middleware/verify.token.js";
import authorizeRoles from "../middleware/admin.verification.js";

const router = express.Router();

// Sample route for user login
router.post("/register", register);
router.post("/login", Login);
router.get("/refresh", refresh);
router.post("/change-password", verifyToken, changePassword);
router.post("/logout", verifyToken, logout);

export default router;
