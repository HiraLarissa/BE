import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updateFoto,
  hapusFoto,
  updatePassword,
  googleLogin,
  googleRegister,
  getArsitekProfile
} from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import multer from 'multer';

const router = express.Router();

// MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// ================= ROUTES =================
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/google-register', googleRegister);
router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.put('/update-password', authMiddleware, updatePassword);
router.put('/upload-foto', authMiddleware, upload.single('foto'), updateFoto);
router.delete('/hapus-foto', authMiddleware, hapusFoto);
router.get("/arsitek", getArsitekProfile);


export default router;
