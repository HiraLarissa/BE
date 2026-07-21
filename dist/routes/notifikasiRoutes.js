"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notifikasiController_1 = require("../controllers/notifikasiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, notifikasiController_1.getNotifikasi);
router.put("/:id/read", authMiddleware_1.authMiddleware, notifikasiController_1.markAsRead);
router.put("/read-all", authMiddleware_1.authMiddleware, notifikasiController_1.markAllAsRead);
router.delete("/:id", authMiddleware_1.authMiddleware, notifikasiController_1.deleteNotifikasi);
exports.default = router;
//# sourceMappingURL=notifikasiRoutes.js.map