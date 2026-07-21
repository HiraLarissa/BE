"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRevisi = exports.uploadLegacy = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
/* =========================
   STORAGE CONFIG (BARU)
========================= */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueName + path_1.default.extname(file.originalname));
    },
});
/* =========================
   FILTER FILE (BARU)
========================= */
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|glb|zip/;
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error("Format file tidak didukung"));
    }
};
/* =========================
   MULTER BARU (RECOMMENDED)
========================= */
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
});
/* =========================================================
   🔥 BACKWARD COMPATIBILITY (JANGAN DIHAPUS)
   ini untuk jaga-jaga kalau ada controller lama masih pakai
========================================================= */
exports.uploadLegacy = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "uploads/");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        },
    }),
});
/* =========================
   UPLOAD KHUSUS REVISI
========================= */
exports.uploadRevisi = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "uploads/revisi/");
        },
        filename: (req, file, cb) => {
            const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, uniqueName + path_1.default.extname(file.originalname));
        },
    }),
    fileFilter,
});
//# sourceMappingURL=upload.js.map