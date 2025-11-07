import ShiftSession from "../models/ShiftSession.js";
import ShiftReport from "../models/ShiftReport.js";

// 🟢 START SHIFT
export const startShift = async (req, res) => {
  try {
    const user = req.user;

    // Check for an existing active shift
    const existing = await ShiftSession.findOne({ cashierId: user._id, status: "active" });
    if (existing) {
      return res.status(200).json({ message: "Shift already active", shift: existing });
    }

    const shift = await ShiftSession.create({
      cashierId: user._id,
      cashierName: user.name,
      startedAt: new Date(),
      status: "active",
    });

    res.status(201).json({ message: "Shift started", shift });
  } catch (err) {
    console.error("Error starting shift:", err);
    res.status(500).json({ message: "Failed to start shift" });
  }
};

// 🔵 GET ACTIVE SHIFT
export const getActiveShift = async (req, res) => {
  try {
    const user = req.user;
    const shift = await ShiftSession.findOne({ cashierId: user._id, status: "active" });
    if (!shift) return res.status(404).json({ message: "No active shift" });
    res.json({ shift });
  } catch (err) {
    console.error("Error fetching active shift:", err);
    res.status(500).json({ message: "Failed to fetch active shift" });
  }
};

// 🔴 END SHIFT (and create ShiftReport)
export const endShift = async (req, res) => {
  try {
    const user = req.user;
    const { totalSales, totalOrders, cash, gcash, notes } = req.body;

    const shift = await ShiftSession.findOne({
      cashierId: user._id,
      status: "active",
    });

    if (!shift) {
      return res.status(404).json({ message: "No active shift to close" });
    }

    const endedAt = new Date();
    const durationMinutes = Math.floor((endedAt - shift.startedAt) / 60000);

    shift.status = "closed";
    shift.endedAt = endedAt;
    shift.durationMinutes = durationMinutes;
    await shift.save();

    // Create a ShiftReport (end-of-shift summary)
    const report = await ShiftReport.create({
      cashierId: user._id,
      cashierName: user.name,
      totalSales,
      totalOrders,
      cash,
      gcash,
      notes,
      closedAt: endedAt,
    });

    res.json({
      message: "Shift ended successfully",
      shift,
      report,
    });
  } catch (err) {
    console.error("Error ending shift:", err);
    res.status(500).json({ message: "Failed to end shift" });
  }
};

export const pauseShift = async (req, res) => {
  try {
    const user = req.user;
    const shift = await ShiftSession.findOne({ cashierId: user._id, status: "active" });
    if (!shift) return res.status(404).json({ message: "No active shift to pause" });

    shift.status = "paused";
    shift.pausedAt = new Date();
    await shift.save();

    res.json({ message: "Shift paused", shift });
  } catch (err) {
    console.error("Error pausing shift:", err);
    res.status(500).json({ message: "Failed to pause shift" });
  }
};

export const resumeShift = async (req, res) => {
  try {
    const user = req.user;
    const shift = await ShiftSession.findOne({ cashierId: user._id, status: "paused" });
    if (!shift) return res.status(404).json({ message: "No paused shift to resume" });

    const now = new Date();
    const pausedDuration = now - shift.pausedAt;
    shift.totalPausedDuration += pausedDuration;
    shift.pausedAt = null;
    shift.status = "active";
    await shift.save();

    res.json({ message: "Shift resumed", shift });
  } catch (err) {
    console.error("Error resuming shift:", err);
    res.status(500).json({ message: "Failed to resume shift" });
  }
};