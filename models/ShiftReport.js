import mongoose from "mongoose";

const shiftReportSchema = new mongoose.Schema({
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cashierName: { type: String, required: true },
  totalSales: { type: Number, required: true },
  totalOrders: { type: Number, required: true },
  cash: { type: Number, default: 0 },
  gcash: { type: Number, default: 0 },
  notes: { type: String },
  closedAt: { type: Date, default: Date.now },
});

export default mongoose.model("ShiftReport", shiftReportSchema);