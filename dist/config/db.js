"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mysql2_1 = __importDefault(require("mysql2"));
exports.db = mysql2_1.default.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_tugas_akhir",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
console.log("Database pool berhasil dibuat");
//# sourceMappingURL=db.js.map