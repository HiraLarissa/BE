"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jadwalController_1 = require("../controllers/jadwalController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, jadwalController_1.getAllJadwal);
router.get("/:id", authMiddleware_1.authMiddleware, jadwalController_1.getJadwalById);
router.post("/", authMiddleware_1.authMiddleware, jadwalController_1.createJadwal);
router.put("/:id", authMiddleware_1.authMiddleware, jadwalController_1.updateJadwal);
router.delete("/:id", authMiddleware_1.authMiddleware, jadwalController_1.deleteJadwal);
exports.default = router;
//# sourceMappingURL=jadwalRoutes.js.map