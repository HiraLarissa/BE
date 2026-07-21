"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pemesananController_1 = require("../controllers/pemesananController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// ================= GET =================
router.get("/", pemesananController_1.getAllPemesanan);
router.get("/klien", authMiddleware_1.authMiddleware, pemesananController_1.getPemesananKlien);
router.get("/:id", pemesananController_1.getPemesananById);
// ================= CREATE =================
router.post("/", authMiddleware_1.authMiddleware, upload_1.upload.fields([
    { name: "gambar", maxCount: 1 },
    { name: "gambar_rekomendasi", maxCount: 1 }
]), pemesananController_1.createPemesanan);
// ================= UPDATE =================
router.put("/:id", authMiddleware_1.authMiddleware, upload_1.upload.fields([
    { name: "gambar", maxCount: 1 },
    { name: "gambar_rekomendasi", maxCount: 1 }
]), pemesananController_1.updatePemesanan);
// ================= DELETE =================
router.delete("/:id", authMiddleware_1.authMiddleware, pemesananController_1.deletePemesanan);
router.get("/available", pemesananController_1.getAvailablePemesanan);
exports.default = router;
//# sourceMappingURL=pemesananRoutes.js.map