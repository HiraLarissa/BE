import express from "express";
import {
  getNotifikasi,
  markAsRead,
  markAllAsRead,
  deleteNotifikasi,
} from "../controllers/notifikasiController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getNotifikasi);
router.put("/:id/read", authMiddleware, markAsRead);
router.put("/read-all", authMiddleware, markAllAsRead);
router.delete("/:id", authMiddleware, deleteNotifikasi);

export default router;