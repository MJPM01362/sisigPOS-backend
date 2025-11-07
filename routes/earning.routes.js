import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import RawMaterial from "../models/RawMaterial.js";

const router = express.Router();

// 🧮 Compute daily earnings
router.get("/earnings", async (req, res) => {
  try {
    const range = req.query.range || "monthly";

    // Compute date range
    const now = new Date();
    const startDate = new Date();
    if (range === "daily") startDate.setDate(now.getDate() - 1);
    else if (range === "weekly") startDate.setDate(now.getDate() - 7);
    else if (range === "monthly") startDate.setDate(now.getDate() - 30);

    // Get orders in that range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: now },
    }).populate("items.product");

    // Group by date
    const dailyEarnings = {};

    for (const order of orders) {
      const dateKey = order.createdAt.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      });

      let totalSales = 0;
      let totalCost = 0;

      for (const item of order.items) {
        const price = item.price * item.quantity;
        const productCost = item.product?.costPerUnit
          ? item.product.costPerUnit * item.quantity
          : 0;

        totalSales += price;
        totalCost += productCost;
      }

      const profit = totalSales - totalCost;

      if (!dailyEarnings[dateKey]) {
        dailyEarnings[dateKey] = { date: dateKey, earnings: profit };
      } else {
        dailyEarnings[dateKey].earnings += profit;
      }
    }

    res.json(Object.values(dailyEarnings));
  } catch (err) {
    console.error("❌ Earnings report error:", err);
    res.status(500).json({ message: "Failed to compute earnings" });
  }
});

export default router;