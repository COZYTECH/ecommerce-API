import express from "express";
import { loginAdmin, superAdmin } from "../controller/admin.auth.controller.js";
const router = express.Router();
//admin creatn route
router.post("/create-admin", superAdmin);
router.post("/login-admin", loginAdmin);

export default router;
