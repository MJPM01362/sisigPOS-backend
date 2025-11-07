import express from "express";
import { getBackground, updateBackground } from "../controllers/userSettingsController.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/admin/settings", getBackground);
router.post("/admin/settings", verifyToken, updateBackground);

export default router;
