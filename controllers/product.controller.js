import fs from "fs";
import Product from "../models/Product.js";

// GET /api/products
export const getAllProducts = async (req, res) => {
  const products = await Product.find().populate("ingredients.material");
  res.json(products);
};

// GET /api/products/:id
export const getOneProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("ingredients.material");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/products
export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    if (typeof data.ingredients === "string") {
      data.ingredients = JSON.parse(data.ingredients);
    }
    if (!Array.isArray(data.ingredients)) {
      return res.status(400).json({ error: "Invalid ingredients format" });
    }

    if (typeof data.options === "string") {
      try {
        data.options = JSON.parse(data.options);
      } catch (err) {
        return res.status(400).json({ error: "Invalid options format" });
      }
    }

    data.price = parseFloat(data.price);
    data.quantity = parseInt(data.quantity);

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Product creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const data = req.body;

    if (typeof data.ingredients === "string") {
      data.ingredients = JSON.parse(data.ingredients);
    }

    if (typeof data.options === "string") {
      try {
        data.options = JSON.parse(data.options);
      } catch (err) {
        return res.status(400).json({ error: "Invalid options format" });
      }
    }

    if (data.price) {
      data.price = parseFloat(data.price);
    }
    if (data.quantity) {
      data.quantity = parseInt(data.quantity);
    }

    if (data.image === "null" || data.image === null) {
      const product = await Product.findById(req.params.id);
      if (product?.image) {
        const imagePath = `.${product.image}`;
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      data.image = undefined;
    }

    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Update error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/products/:id/image
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.image) {
      const imagePath = `.${product.image}`;
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      product.image = null;
      await product.save();
    }

    res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("❌ Failed to delete image:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
};

// 🟢 GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
  try {
    // Optional: Auto-include new products created within last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const featured = await Product.find({
      $or: [
        { isFeatured: true },
        { createdAt: { $gte: sevenDaysAgo } },
      ],
      isAvailable: true,
    })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json(featured);
  } catch (err) {
    console.error("❌ Failed to fetch featured products:", err.message);
    res.status(500).json({ error: "Failed to fetch featured products" });
  }
};

// 🟢 PATCH /api/products/:id/featured
export const toggleFeaturedStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({
      message: `Product ${product.isFeatured ? "marked as featured" : "removed from featured"}`,
      product,
    });
  } catch (err) {
    console.error("❌ Failed to toggle featured status:", err.message);
    res.status(500).json({ error: "Failed to toggle featured status" });
  }
};