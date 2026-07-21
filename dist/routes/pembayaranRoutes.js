"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pembayaranController_1 = require("../controllers/pembayaranController");
const midtransMiddleware_1 = require("../middleware/midtransMiddleware");
const router = express_1.default.Router();
router.post("/payment", pembayaranController_1.createPayment);
router.get("/", pembayaranController_1.getAllPembayaran);
router.get("/check/:order_id", pembayaranController_1.checkAndUpdatePaymentStatus);
router.post("/payment/webhook", midtransMiddleware_1.verifyMidtransSignature, pembayaranController_1.handleMidtransWebhook);
exports.default = router;
//# sourceMappingURL=pembayaranRoutes.js.map