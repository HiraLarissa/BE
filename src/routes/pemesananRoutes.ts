import express from 'express';
import {
  getAllPemesanan,
  getPemesananById,
  createPemesanan,
  updatePemesanan,
  deletePemesanan,
  getAvailablePemesanan,
  getPemesananKlien,
} from '../controllers/pemesananController';

import { authMiddleware } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';

const router = express.Router();

// ================= GET =================
router.get('/', getAllPemesanan);
router.get('/klien', authMiddleware, getPemesananKlien);
router.get('/:id', getPemesananById);

// ================= CREATE =================
router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'gambar', maxCount: 1 },
    { name: 'gambar_rekomendasi', maxCount: 1 },
  ]),
  createPemesanan
);

// ================= UPDATE =================
router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'gambar', maxCount: 1 },
    { name: 'gambar_rekomendasi', maxCount: 1 },
  ]),
  updatePemesanan
);

// ================= DELETE =================
router.delete('/:id', authMiddleware, deletePemesanan);
router.get('/available', getAvailablePemesanan);

export default router;
