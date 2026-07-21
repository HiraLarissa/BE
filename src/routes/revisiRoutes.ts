import express from 'express';
import {
  createRevisi,
  getRevisi,
  updateStatusRevisi,
  getRevisiByPemesanan,
} from '../controllers/revisiController';
import { uploadRevisi } from '../middleware/upload';

const router = express.Router();

router.post('/', uploadRevisi.single('file'), createRevisi);
router.get('/', getRevisi);
router.get('/pemesanan/:pemesanan_id', getRevisiByPemesanan);
router.put('/:id', updateStatusRevisi);

export default router;
