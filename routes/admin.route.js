import express from "express";
import {
  loginAdmin,
  createAdmin,
} from "../controller/admin.auth.controller.js";
import authorizeRoles from "../middleware/admin.verification.js";
import { verifyToken } from "../middleware/verify.token.js";
const router = express.Router();
//admin creatn route
router.post(
  "/create-admin",
  verifyToken,
  authorizeRoles("superadmin"),
  createAdmin
);
router.post("/login-admin", loginAdmin);

export default router;
