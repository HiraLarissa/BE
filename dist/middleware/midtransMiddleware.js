"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMidtransSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const verifyMidtransSignature = (req, res, next) => {
    try {
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        if (!serverKey) {
            return res.status(500).json({
                message: "Server key tidak ditemukan",
            });
        }
        const { order_id, status_code, gross_amount, signature_key, } = req.body;
        if (!order_id || !status_code || !gross_amount || !signature_key) {
            return res.status(400).json({
                message: "Data webhook tidak lengkap",
            });
        }
        const hash = crypto_1.default
            .createHash("sha512")
            .update(order_id + status_code + gross_amount + serverKey)
            .digest("hex");
        if (hash !== signature_key) {
            return res.status(403).json({
                message: "Invalid signature",
            });
        }
        next();
    }
    catch (error) {
        console.error("SIGNATURE ERROR:", error);
        return res.status(500).json({
            message: "Signature verification error",
        });
    }
};
exports.verifyMidtransSignature = verifyMidtransSignature;
//# sourceMappingURL=midtransMiddleware.js.map