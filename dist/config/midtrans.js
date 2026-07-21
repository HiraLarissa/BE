"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreApi = exports.snap = void 0;
const midtrans_client_1 = __importDefault(require("midtrans-client"));
exports.snap = new midtrans_client_1.default.Snap({
    isProduction: false, //sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
exports.coreApi = new midtrans_client_1.default.CoreApi({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
//# sourceMappingURL=midtrans.js.map