"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// 🔧 MULTER
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage });
// ================= ROUTES =================
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
router.post("/google", authController_1.googleLogin);
router.get("/me", authMiddleware_1.authMiddleware, authController_1.getProfile);
router.put("/me", authMiddleware_1.authMiddleware, authController_1.updateProfile);
router.put("/update-password", authMiddleware_1.authMiddleware, authController_1.updatePassword);
router.put("/upload-foto", authMiddleware_1.authMiddleware, upload.single("foto"), authController_1.updateFoto);
router.delete("/hapus-foto", authMiddleware_1.authMiddleware, authController_1.hapusFoto);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map