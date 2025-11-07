import express from "express";
import { createShiftReport } from "../controllers/shiftReportController.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, createShiftReport);

export default router;