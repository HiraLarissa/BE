import multer from 'multer';
import path from 'path';
import fs from 'fs';

// memastikan folder
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const UPLOAD_DIR = '/app/uploads';
const REVISI_DIR = '/app/uploads/revisi';

ensureDir(UPLOAD_DIR);
ensureDir(REVISI_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// FILTER FILE 
const fileFilter = (req: any, file: any, cb: any) => {
  const allowed = /jpeg|jpg|png|pdf|glb|zip/;

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung'));
  }
};

// MULTER BARU
export const upload = multer({
  storage,
  fileFilter,
});

export const uploadLegacy = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  }),
});

export const uploadRevisi = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, REVISI_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

      cb(null, uniqueName + path.extname(file.originalname));
    },
  }),
  fileFilter,
});
