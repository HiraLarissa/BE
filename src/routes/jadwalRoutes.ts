import express from "express";
import {
  getAllJadwal,
  getJadwalById,
  createJadwal,
  updateJadwal,
  deleteJadwal,
} from "../controllers/jadwalController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getAllJadwal);
router.get("/:id", authMiddleware, getJadwalById);
router.post("/", authMiddleware, createJadwal);
router.put("/:id", authMiddleware, updateJadwal);
router.delete("/:id", authMiddleware, deleteJadwal);

export default router;