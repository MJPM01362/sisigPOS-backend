import mongoose from "mongoose";

const shiftSessionSchema = new mongoose.Schema({
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cashierName: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  pausedAt: { type: Date },
  totalPausedDuration: { type: Number, default: 0 }, // in milliseconds
  status: { type: String, enum: ["active", "paused", "closed"], default: "active" },
  durationMinutes: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("ShiftSession", shiftSessionSchema);