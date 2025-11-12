import express, { Router } from "express";
import { register } from "../controller/auth.controller.js";

const router = express.Router();

// Sample route for user login
router.post("/register", register);

export default router;
