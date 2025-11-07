import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["Sisig", "Sizzling", "Silog", "Extras", "Drinks"],
      required: true,
    },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    image: { type: String },

    isFeatured: { type: Boolean, default: false },

    ingredients: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RawMaterial",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    options: [
      {
        label: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);