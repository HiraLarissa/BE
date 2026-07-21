"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const revisiController_1 = require("../controllers/revisiController");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// klien ajukan revisi
router.post("/", upload_1.uploadRevisi.single("file"), revisiController_1.createRevisi);
// arsitek lihat semua revisi
router.get("/", revisiController_1.getRevisi);
router.get("/pemesanan/:pemesanan_id", revisiController_1.getRevisiByPemesanan);
// arsitek update status
router.put("/:id", revisiController_1.updateStatusRevisi);
exports.default = router;
//# sourceMappingURL=revisiRoutes.js.map