"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const layananController_1 = require("../controllers/layananController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/", layananController_1.getAllLayanan);
router.get("/:id", layananController_1.getLayananById);
// protected (opsional)
router.post("/", authMiddleware_1.authMiddleware, layananController_1.upload.single("gambar"), layananController_1.createLayanan);
router.put("/:id", authMiddleware_1.authMiddleware, layananController_1.upload.single("gambar"), layananController_1.updateLayanan);
router.delete("/:id", authMiddleware_1.authMiddleware, layananController_1.deleteLayanan);
exports.default = router;
//# sourceMappingURL=layananRoutes.js.map