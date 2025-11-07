import bcrypt from "bcryptjs";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import RawMaterial from "../models/RawMaterial.js";
import User from "../models/User.js";

const restoreProductStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.product).populate("ingredients.material");
    if (!product) continue;

    product.quantity += item.quantity;

    for (const ingredient of product.ingredients) {
    if (!ingredient.material || !ingredient.material._id) continue;

    const material = await RawMaterial.findById(ingredient.material._id);
    if (material) {
      material.quantity += ingredient.quantity * item.quantity;
      await material.save();
    }
  }

    await product.save();
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { items, paymentMethod, orderType, gcashCode, tip = 0, cashPaid = 0 } = req.body;

    let total = 0;
    let totalCost = 0;
    const sanitizedItems = [];

    if (!["Cash", "GCash"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    if (paymentMethod === "GCash" && (!gcashCode || !gcashCode.trim())) {
      return res.status(400).json({ message: "GCash reference code is required." });
    }

    if (!["Dine-In", "Delivery", "Takeout"].includes(orderType)) {
      return res.status(400).json({ message: "Invalid order type." });
    }

    for (const item of items) {
      const product = await Product.findById(item.product).populate("ingredients.material");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }

      total += product.price * quantity;

    for (const ingredient of product.ingredients) {
      const usedQty = ingredient.quantity * quantity;
      if (!ingredient.material || !ingredient.material._id) {
        return res.status(400).json({ message: `Product "${product.name}" has an invalid ingredient.` });
      }

      const material = await RawMaterial.findById(ingredient.material._id);
      if (!material || material.quantity < usedQty) {
        return res.status(400).json({ message: `Not enough ${material?.name || 'material'}` });
      }

      const costPerUnit = material.costPerUnit || 0;
      totalCost += costPerUnit * usedQty;

      material.quantity -= usedQty;
      await material.save();
    }

      product.quantity -= quantity;
      await product.save();

      sanitizedItems.push({ product: product._id, quantity });
    }

    let change = 0;
    if (paymentMethod === "Cash") {
      if (cashPaid < total + Number(tip)) {
        return res.status(400).json({ message: "Insufficient cash provided." });
      }
      change = cashPaid - (total + Number(tip));
    }

    const orderData = {
      items: sanitizedItems,
      total,
      totalCost, // ✅ save total material cost
      tip: Number(tip),
      cashPaid: Number(cashPaid),
      change,
      paymentMethod,
      orderType,
      cashier: req.user._id,
      gcashCode: paymentMethod === "GCash" ? gcashCode.trim() : null,
    };

    const order = await Order.create(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error("❌ Order Placement Error:", error);
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = {};

    if (start || end) {
      filter.createdAt = {};
      if (start) {
        filter.createdAt.$gte = new Date(start);
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    if (req.query.orderType) {
      filter.orderType = req.query.orderType;
    }

    const orders = await Order.find(filter)
      .populate("items.product", "name price")
      .populate("cashier", "email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

const validateAdmin = async (email, password) => {
  const admin = await User.findOne({ email });
  if (!admin || admin.role !== "admin") return { valid: false };

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return { valid: false };

  return { valid: true, admin };
};

export const voidOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail, adminPassword } = req.body;

    const { valid } = await validateAdmin(adminEmail, adminPassword);
    if (!valid) {
      return res.status(403).json({ message: "Invalid admin credentials" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.isVoided) return res.status(400).json({ message: "Order already voided" });

    await restoreProductStock(order.items);

    order.isVoided = true;
    await order.save();

    res.json({ message: "✅ Order voided and stock restored successfully" });
  } catch (err) {
    console.error("❌ Void error:", err.message, err.stack);
    res.status(500).json({ message: "❌ Failed to void order", error: err.message });
}
};

export const refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail, adminPassword } = req.body;

    const { valid } = await validateAdmin(adminEmail, adminPassword);
    if (!valid) {
      return res.status(403).json({ message: "Invalid admin credentials" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.isRefunded) return res.status(400).json({ message: "Order already refunded" });

    order.isRefunded = true;
    order.refundDate = new Date();
    await order.save();

    res.json({ message: "✅ Order refunded successfully" });
  } catch (err) {
    console.error("❌ Refund error:", err);
    res.status(500).json({ message: "❌ Failed to refund order" });
  }
};