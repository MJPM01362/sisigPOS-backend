import express from "express";
import {
    createProduct,
    deleteProduct,
    deleteProductImage,
    getAllProducts,
    getOneProduct,
    updateProduct,
    getFeaturedProducts,
    toggleFeaturedStatus, 
} from "../controllers/product.controller.js";
import { isAdmin, verifyToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/featured", verifyToken, getFeaturedProducts);
router.get("/", verifyToken, getAllProducts);
router.get("/:id", verifyToken, getOneProduct);

router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateProduct);
router.post("/", verifyToken, isAdmin, upload.single("image"), createProduct);

router.patch("/:id/featured", verifyToken, isAdmin, toggleFeaturedStatus);

router.delete("/:id/image", verifyToken, isAdmin, deleteProductImage);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default router;