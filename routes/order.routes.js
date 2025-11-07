import express from "express";
import { getOrders, placeOrder, refundOrder, voidOrder } from "../controllers/order.controller.js";
import { getReceipt } from "../controllers/receipt.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", verifyToken, placeOrder);
router.post("/", placeOrder);
router.get("/", getOrders);
router.get("/:id/receipt", getReceipt);
router.patch("/:id/void", voidOrder);
router.patch("/:id/refund", refundOrder);


export default router;