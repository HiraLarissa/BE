"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "SECRET_KEY";
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token tidak ada" });
    }
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ message: "Format token salah" });
    }
    const token = parts[1];
    if (!token) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        req.user = {
            id: Number(decoded.id),
            email: String(decoded.email),
            role: String(decoded.role),
        };
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "Token tidak valid" });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map