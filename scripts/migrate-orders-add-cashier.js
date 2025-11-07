import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";

dotenv.config();

const migrateOrders = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI);
    console.log("✅ Connected to MongoDB for migration");

    const defaultCashier = await User.findOne({ role: "cashier" });

    if (!defaultCashier) {
      console.error("❌ No cashier found. Please create at least one cashier user first.");
      process.exit(1);
    }

    const ordersToUpdate = await Order.find({ cashier: { $exists: false } });

    console.log(`🔄 Found ${ordersToUpdate.length} orders to update.`);

    for (const order of ordersToUpdate) {
      order.cashier = defaultCashier._id;
      await order.save();
    }

    console.log(`✅ Migration complete. ${ordersToUpdate.length} orders updated.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
};

migrateOrders();
