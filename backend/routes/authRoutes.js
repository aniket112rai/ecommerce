import express from "express";
import { register, login, googleLogin, getMe, updateMe } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin) ;
router.get("/me", authMiddleware(), getMe);
router.put("/me", authMiddleware(), updateMe);

export default router;

