"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const hasilDesainController_1 = require("../controllers/hasilDesainController");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// field config multiple — reusable
const multiUploadFields = upload_1.upload.fields([
    { name: "denah", maxCount: 10 },
    { name: "gambar", maxCount: 10 },
    { name: "file3d", maxCount: 10 },
]);
router.post("/upload", multiUploadFields, hasilDesainController_1.createHasilDesain);
router.post("/append", upload_1.upload.fields([
    { name: "denah", maxCount: 10 },
    { name: "gambar", maxCount: 10 },
    { name: "file3d", maxCount: 10 },
]), hasilDesainController_1.appendHasilDesain);
router.get("/", hasilDesainController_1.getAllHasilDesain);
router.get("/:id", hasilDesainController_1.getByPemesananId);
// update status
router.patch("/status/:id", hasilDesainController_1.updateStatus);
exports.default = router;
//# sourceMappingURL=hasilDesainRoutes.js.map