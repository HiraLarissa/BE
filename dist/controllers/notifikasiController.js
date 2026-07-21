"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotifikasi = exports.markAllAsRead = exports.markAsRead = exports.getNotifikasi = exports.insertNotifikasi = void 0;
const db_1 = require("../config/db");
// ================= HELPER: INSERT NOTIFIKASI =================
const insertNotifikasi = (user_id, judul, pesan, type) => {
    db_1.db.query(`INSERT INTO notifikasi (user_id, judul, pesan, type) VALUES (?, ?, ?, ?)`, [user_id, judul, pesan, type], (err) => {
        if (err)
            console.error("NOTIF ERROR:", err);
    });
};
exports.insertNotifikasi = insertNotifikasi;
// ================= GET NOTIFIKASI USER =================
const getNotifikasi = (req, res) => {
    var _a;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    db_1.db.query(`SELECT * FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC`, [user_id], (err, results) => {
        if (err)
            return res.status(500).json({ message: "Gagal ambil notifikasi" });
        res.json(results);
    });
};
exports.getNotifikasi = getNotifikasi;
// ================= MARK AS READ =================
const markAsRead = (req, res) => {
    var _a;
    const { id } = req.params;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    db_1.db.query(`UPDATE notifikasi SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, user_id], (err) => {
        if (err)
            return res.status(500).json({ message: "Gagal update" });
        res.json({ message: "Notifikasi dibaca" });
    });
};
exports.markAsRead = markAsRead;
// ================= MARK ALL AS READ =================
const markAllAsRead = (req, res) => {
    var _a;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    db_1.db.query(`UPDATE notifikasi SET is_read = 1 WHERE user_id = ?`, [user_id], (err) => {
        if (err)
            return res.status(500).json({ message: "Gagal update" });
        res.json({ message: "Semua notifikasi dibaca" });
    });
};
exports.markAllAsRead = markAllAsRead;
// ================= DELETE NOTIFIKASI =================
const deleteNotifikasi = (req, res) => {
    var _a;
    const { id } = req.params;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    db_1.db.query(`DELETE FROM notifikasi WHERE id = ? AND user_id = ?`, [id, user_id], (err) => {
        if (err)
            return res.status(500).json({ message: "Gagal hapus" });
        res.json({ message: "Notifikasi dihapus" });
    });
};
exports.deleteNotifikasi = deleteNotifikasi;
//# sourceMappingURL=notifikasiController.js.map