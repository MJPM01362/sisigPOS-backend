import express from "express";
import { deleteUser, getAllUsers, loginUser, registerUser, updatePassword, updateUser, verifyAdmin, getUserById } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/verify-admin", verifyAdmin);
router.put("/users/:id/password", updatePassword);
router.get("/users/:id", getUserById);


export default router;
