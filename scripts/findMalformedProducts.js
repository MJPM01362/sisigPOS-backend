import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import RawMaterial from "../models/RawMaterial.js";

dotenv.config();

await mongoose.connect(process.env.ATLAS_URI);

const products = await Product.find().populate("ingredients.material");
console.debug("RawMaterial model loaded:", !!RawMaterial);


for (const product of products) {
  const hasInvalid = product.ingredients.some(i => !i.material || !i.material._id);
  if (hasInvalid) {
    console.log(`⚠️ Product "${product.name}" has invalid ingredients.`);
  }
}

mongoose.disconnect();