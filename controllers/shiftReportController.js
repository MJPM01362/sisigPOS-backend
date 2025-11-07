import ShiftReport from "../models/ShiftReport.js";

export const createShiftReport = async (req, res) => {
  try {
    const { totalSales, totalOrders, cash, gcash, notes } = req.body;
    const user = req.user;

    const report = await ShiftReport.create({
      cashierId: user._id,
      cashierName: user.name,
      totalSales,
      totalOrders,
      cash,
      gcash,
      notes,
    });

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save shift report" });
  }
};