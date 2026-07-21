"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const layananRoutes_1 = __importDefault(require("./routes/layananRoutes"));
const pemesananRoutes_1 = __importDefault(require("./routes/pemesananRoutes"));
const pembayaranRoutes_1 = __importDefault(require("./routes/pembayaranRoutes"));
const jadwalRoutes_1 = __importDefault(require("./routes/jadwalRoutes"));
const hasilDesainRoutes_1 = __importDefault(require("./routes/hasilDesainRoutes"));
const revisiRoutes_1 = __importDefault(require("./routes/revisiRoutes"));
const notifikasiRoutes_1 = __importDefault(require("./routes/notifikasiRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const jadwalController_1 = require("./controllers/jadwalController");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("API Jalan 🚀");
});
app.use("/api/users", userRoutes_1.default);
app.use("/api/layanan", layananRoutes_1.default);
app.use("/api/pemesanan", pemesananRoutes_1.default);
app.use("/api/pembayaran", pembayaranRoutes_1.default);
app.use("/api/jadwal", jadwalRoutes_1.default);
app.use("/api/hasil-desain", hasilDesainRoutes_1.default);
app.use("/api/revisi", revisiRoutes_1.default);
app.use("/api/notifikasi", notifikasiRoutes_1.default);
app.use("/api/chatbot", chatRoutes_1.default);
// upload
app.use("/uploads", express_1.default.static("uploads"));
app.use("/uploads", express_1.default.static("public/uploads"));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
exports.default = app;
(0, jadwalController_1.startDeadlineNotifCron)();
//# sourceMappingURL=app.js.map