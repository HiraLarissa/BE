import express from 'express';
import {
  createHasilDesain,
  getByPemesananId,
  updateStatus,
  getAllHasilDesain,
  appendHasilDesain, // ← tambah import ini
} from '../controllers/hasilDesainController';

import { upload } from '../middleware/upload';

const router = express.Router();

// field config multiple
const multiUploadFields = upload.fields([
  { name: 'denah', maxCount: 10 },
  { name: 'gambar', maxCount: 10 },
  { name: 'file3d', maxCount: 10 },
]);

router.post('/upload', multiUploadFields, createHasilDesain);

router.post(
  '/append',
  upload.fields([
    { name: 'denah', maxCount: 10 },
    { name: 'gambar', maxCount: 10 },
    { name: 'file3d', maxCount: 10 },
  ]),
  appendHasilDesain
);

router.get('/', getAllHasilDesain);
router.get('/:id', getByPemesananId);
router.patch('/status/:id', updateStatus);

export default router;
