import express from "express";
import RawMaterial from "../models/RawMaterial.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const material = await RawMaterial.create(req.body);
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const materials = await RawMaterial.find();
  res.json(materials);
});

router.put("/:id", async (req, res) => {
  const material = await RawMaterial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(material);
});

router.delete("/:id", async (req, res) => {
  await RawMaterial.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;