import express from "express";
import {
  getAllLayanan,
  getLayananById,
  createLayanan,
  updateLayanan,
  deleteLayanan,
  upload,
} from "../controllers/layananController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getAllLayanan);
router.get("/:id", getLayananById);
router.post("/", authMiddleware, upload.single("gambar"), createLayanan);
router.put("/:id", authMiddleware, upload.single("gambar"), updateLayanan);
router.delete("/:id", authMiddleware, deleteLayanan);

export default router;