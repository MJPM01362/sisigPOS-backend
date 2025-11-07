import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

export const getReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name price");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument();

    const fontPath = path.join(process.cwd(), "fonts", "NotoSans-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file not found at ${fontPath}`);
    }

    doc.registerFont("NotoSans", fontPath);
    doc.font("NotoSans");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=receipt-${order._id}.pdf`);
    doc.pipe(res);

    // 🧾 Header
    doc.fontSize(18).text("🧾 Receipt", { align: "center" });
    doc.moveDown();

    // 🧍 Order Details
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Order Type: ${order.orderType}`); // ✅ Added here
    doc.text(`Payment Method: ${order.paymentMethod}`);
    if (order.paymentMethod === "GCash" && order.gcashCode) {
      doc.text(`GCash Ref: ${order.gcashCode}`);
    }
    if (order.tip > 0) {
      doc.text(`Tip: ₱${order.tip.toFixed(2)}`);
    }
    doc.moveDown();

    // 🧾 Items
    order.items.forEach((item) => {
      const name = item.product?.name || "Deleted Product";
      const qty = item.quantity;
      const price = item.product?.price || 0;
      doc.text(`${name} × ${qty} — ₱${(qty * price).toFixed(2)}`);
    });

    doc.moveDown();

    // 💵 Totals
    doc.font("NotoSans").fontSize(14).text(`Total: ₱${order.total.toFixed(2)}`, { align: "right" });
    if (order.paymentMethod === "Cash") {
      doc.text(`Cash Paid: ₱${order.cashPaid.toFixed(2)}`, { align: "right" });
      doc.text(`Change: ₱${order.change.toFixed(2)}`, { align: "right" });
    }

    doc.end();
  } catch (err) {
    console.error("❌ PDF Error:", err);
    res.status(500).json({ message: "Failed to generate receipt." });
  }
};