import express from "express";
import {
  startShift,
  getActiveShift,
  endShift, 
  pauseShift,
  resumeShift
} from "../controllers/shift.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", verifyToken, startShift);
router.get("/active", verifyToken, getActiveShift);
router.post("/end", verifyToken, endShift);
router.post("/pause", verifyToken, pauseShift);
router.post("/resume", verifyToken, resumeShift);

export default router;