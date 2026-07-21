"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStatusRevisi = exports.getRevisiByPemesanan = exports.getRevisi = exports.createRevisi = void 0;
const db_1 = require("../config/db");
const notifikasiController_1 = require("./notifikasiController");
// ================= TAMBAH REVISI =================
const createRevisi = (req, res) => {
    var _a;
    const { pemesanan_id, jenis_revisi, catatan } = req.body;
    const file = ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) || null;
    db_1.db.query("SELECT COUNT(*) as total FROM revisi WHERE pemesanan_id = ?", [pemesanan_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Gagal hitung revisi" });
        }
        const revisi_ke = results[0].total + 1;
        db_1.db.query(`INSERT INTO revisi 
        (pemesanan_id, jenis_revisi, catatan, file_referensi, status, revisi_ke)
        VALUES (?, ?, ?, ?, 'menunggu', ?)`, [pemesanan_id, jenis_revisi, catatan, file, revisi_ke], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Gagal tambah revisi" });
            }
            db_1.db.query(`SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`, (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].id, "Permintaan Revisi Baru", `Ada permintaan revisi baru #${revisi_ke} untuk pemesanan #${pemesanan_id}.`, "revisi");
                }
            });
            // Notifikasi ke klien
            db_1.db.query(`SELECT user_id FROM pemesanan WHERE id = ?`, [pemesanan_id], (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Revisi Berhasil Diajukan", `Permintaan revisi #${revisi_ke} berhasil diajukan. Menunggu diproses oleh arsitek.`, "revisi");
                }
            });
            res.json({ message: "Revisi berhasil diajukan" });
        });
    });
};
exports.createRevisi = createRevisi;
// ================= GET REVISI =================
const getRevisi = (req, res) => {
    db_1.db.query(`SELECT r.* FROM revisi r ORDER BY r.id DESC`, (err, results) => {
        if (err) {
            console.error("ERROR SQL:", err);
            return res.status(500).json({ message: "Gagal ambil data revisi" });
        }
        res.json(results);
    });
};
exports.getRevisi = getRevisi;
// ================= GET REVISI BY PEMESANAN =================
const getRevisiByPemesanan = (req, res) => {
    const { pemesanan_id } = req.params;
    db_1.db.query(`SELECT * FROM revisi WHERE pemesanan_id = ? ORDER BY id DESC`, [pemesanan_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Gagal ambil revisi" });
        }
        res.json(results);
    });
};
exports.getRevisiByPemesanan = getRevisiByPemesanan;
// ================= UPDATE STATUS =================
const updateStatusRevisi = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db_1.db.query("UPDATE revisi SET status = ? WHERE id = ?", [status, id], (err) => {
        if (err) {
            return res.status(500).json({ message: "Gagal update status" });
        }
        if (status === "selesai") {
            db_1.db.query(`SELECT p.user_id, p.jenis_bangunan FROM pemesanan p
           INNER JOIN revisi r ON r.pemesanan_id = p.id
           WHERE r.id = ?`, [id], (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Revisi Selesai Dikerjakan", `Revisi untuk ${rows[0].jenis_bangunan} telah selesai dikerjakan. Silakan cek hasilnya.`, "revisi");
                }
            });
        }
        res.json({ message: "Status revisi diupdate" });
    });
};
exports.updateStatusRevisi = updateStatusRevisi;
//# sourceMappingURL=revisiController.js.map