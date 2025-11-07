import mongoose from "mongoose";

const rawMaterialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: [
        "kilograms",
        "grams",
        "pounds",
        "ounces",
        "liters",
        "milliliters",
        "pieces",
        "packs",
        "bags",
        "boxes",
        "cans",
      ],
      default: "pieces",
    },
    totalCost: { type: Number, required: true, min: 0, default: 0 },
    costPerUnit: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

rawMaterialSchema.pre("save", function (next) {
  if (this.quantity > 0) {
    if (this.totalCost && !this.costPerUnit) {
      this.costPerUnit = this.totalCost / this.quantity;
    }

    if (this.costPerUnit && !this.totalCost) {
      this.totalCost = this.costPerUnit * this.quantity;
    }
  }

  next();
});

const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
export default RawMaterial;