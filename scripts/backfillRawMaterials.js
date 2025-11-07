import mongoose from "mongoose";
import RawMaterial from "../models/RawMaterial.js";

const runBackfill = async () => {
  await mongoose.connect("YOUR_MONGO_URI");

  const materials = await RawMaterial.find();

  for (const material of materials) {
    if (!material.costPerUnit && material.quantity > 0) {
      material.totalCost = 0;
      material.costPerUnit = 0;
      await material.save();
    }
  }

  console.log("Backfill complete.");
  mongoose.connection.close();
};

runBackfill();