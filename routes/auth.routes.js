import express from "express";
import { Login, register, refresh } from "../controller/auth.controller.js";

const router = express.Router();

// Sample route for user login
router.post("/register", register);
router.post("/login", Login);
router.get("/refresh", refresh);

export default router;
