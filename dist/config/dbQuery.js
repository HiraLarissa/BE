"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const util_1 = __importDefault(require("util"));
const db_1 = require("./db");
exports.query = util_1.default.promisify(db_1.db.query).bind(db_1.db);
//# sourceMappingURL=dbQuery.js.map