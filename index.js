import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import rawMaterialRoutes from "./routes/rawMaterialRoutes.js";
import reportRoutes from "./routes/report.routes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import shiftReportRoutes from "./routes/shiftReportRoutes.js";
import userRoutes from "./routes/user.routes.js";
import shiftRoutes from "./routes/shift.routes.js";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/raw-materials", rawMaterialRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api", settingsRoutes);
app.use("/api/shift-reports", shiftReportRoutes);
app.use("/api/shifts", shiftRoutes);



const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.ATLAS_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("✅ Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Sisig ni Law API is running");
});