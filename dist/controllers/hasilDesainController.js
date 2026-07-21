"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllHasilDesain = exports.updateStatus = exports.getByPemesananId = exports.appendHasilDesain = exports.createHasilDesain = void 0;
const db_1 = require("../config/db");
const notifikasiController_1 = require("./notifikasiController");
// ================= CREATE / UPLOAD =================
const createHasilDesain = (req, res) => {
    var _a, _b, _c;
    const { pemesanan_id, keterangan } = req.body;
    const files = req.files;
    // Multiple files per kategori — ambil semua filename, join dengan koma
    const denahFiles = ((_a = files === null || files === void 0 ? void 0 : files.denah) === null || _a === void 0 ? void 0 : _a.map((f) => f.filename)) || [];
    const gambarFiles = ((_b = files === null || files === void 0 ? void 0 : files.gambar) === null || _b === void 0 ? void 0 : _b.map((f) => f.filename)) || [];
    const file3dFiles = ((_c = files === null || files === void 0 ? void 0 : files.file3d) === null || _c === void 0 ? void 0 : _c.map((f) => f.filename)) || [];
    // Simpan sebagai JSON string agar bisa store multiple
    const denah = denahFiles.length > 0 ? JSON.stringify(denahFiles) : null;
    const gambar = gambarFiles.length > 0 ? JSON.stringify(gambarFiles) : null;
    const file3d = file3dFiles.length > 0 ? JSON.stringify(file3dFiles) : null;
    const status = denah && gambar && file3d ? "selesai" : "proses";
    const sql = `
    INSERT INTO hasil_desain 
    (pemesanan_id, keterangan, denah_url, gambar_url, file3d_url, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    db_1.db.query(sql, [pemesanan_id, keterangan || null, denah, gambar, file3d, status], (err, result) => {
        if (err)
            return res.status(500).json({ message: "Gagal upload", error: err.message });
        db_1.db.query(`SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`, [pemesanan_id], (err, rows) => {
            if (!err && rows.length > 0) {
                (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Hasil Desain Tersedia", `Hasil desain untuk ${rows[0].jenis_bangunan} sudah diupload.`, "hasil_desain");
            }
            selesaikanProyekSetelahUpload(pemesanan_id);
        });
        return res.json({
            success: true,
            message: "Hasil desain berhasil dikirim ke klien dan masuk ke riwayat proyek.",
            status,
            id: result.insertId,
        });
    });
};
exports.createHasilDesain = createHasilDesain;
// ================= APPEND / UPLOAD REVISI =================
// CATATAN:
// fungsi ini sekarang dipakai untuk upload REVISI
// jadi tidak menggabungkan ke hasil desain awal
// tapi membuat data baru sebagai Revisi ke-1, Revisi ke-2, dst
const appendHasilDesain = (req, res) => {
    var _a, _b, _c;
    const { pemesanan_id, keterangan } = req.body;
    const files = req.files;
    const denahFiles = ((_a = files === null || files === void 0 ? void 0 : files.denah) === null || _a === void 0 ? void 0 : _a.map((f) => f.filename)) || [];
    const gambarFiles = ((_b = files === null || files === void 0 ? void 0 : files.gambar) === null || _b === void 0 ? void 0 : _b.map((f) => f.filename)) || [];
    const file3dFiles = ((_c = files === null || files === void 0 ? void 0 : files.file3d) === null || _c === void 0 ? void 0 : _c.map((f) => f.filename)) || [];
    const denah = denahFiles.length > 0 ? JSON.stringify(denahFiles) : null;
    const gambar = gambarFiles.length > 0 ? JSON.stringify(gambarFiles) : null;
    const file3d = file3dFiles.length > 0 ? JSON.stringify(file3dFiles) : null;
    const status = denah && gambar && file3d ? "selesai" : "proses";
    // Hitung sudah ada berapa data hasil desain untuk pemesanan ini
    // row pertama = hasil desain awal
    // row berikutnya = revisi
    db_1.db.query(`SELECT COUNT(*) AS total FROM hasil_desain WHERE pemesanan_id = ?`, [pemesanan_id], (err, rows) => {
        var _a;
        if (err) {
            return res.status(500).json({
                message: "Gagal menghitung hasil desain",
                error: err.message,
            });
        }
        const totalData = ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Kalau sudah ada 1 data awal, maka upload berikutnya adalah revisi ke-1
        const revisiKe = totalData;
        const keteranganFinal = keterangan || `Revisi ke-${revisiKe}`;
        const sql = `
        INSERT INTO hasil_desain 
        (pemesanan_id, keterangan, denah_url, gambar_url, file3d_url, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
        db_1.db.query(sql, [pemesanan_id, keteranganFinal, denah, gambar, file3d, status], (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: "Gagal upload revisi",
                    error: err.message,
                });
            }
            db_1.db.query(`SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`, [pemesanan_id], (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Revisi Desain Tersedia", `Revisi desain untuk ${rows[0].jenis_bangunan} sudah diupload.`, "hasil_desain");
                }
                selesaikanProyekSetelahUpload(pemesanan_id);
            });
            return res.json({
                success: true,
                message: `Revisi ke-${revisiKe} berhasil dikirim ke klien dan masuk ke riwayat proyek.`,
                status,
                id: result.insertId,
                revisi_ke: revisiKe,
            });
        });
    });
};
exports.appendHasilDesain = appendHasilDesain;
function tryParseJSON(val) {
    if (!val)
        return null;
    try {
        return JSON.parse(val);
    }
    catch (_a) {
        return val ? [val] : null;
    } // fallback: string lama dianggap single item
}
// ================= GET BY PEMESANAN =================
const getByPemesananId = (req, res) => {
    const { id } = req.params;
    const sql = `
    SELECT * FROM hasil_desain 
    WHERE pemesanan_id = ?
    ORDER BY created_at ASC, id ASC
  `;
    db_1.db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("🔥 DB ERROR:", err);
            return res.status(500).json({
                message: "Gagal ambil data",
                error: err.message,
            });
        }
        const data = Array.isArray(result) ? result : [];
        if (data.length === 0) {
            return res.json({
                hasil_awal: null,
                revisi: [],
                total_revisi: 0,
                data: [],
            });
        }
        const JUMLAH_FILE_DESAIN_AWAL = 4;
        const firstItem = data[0];
        const denahFiles = tryParseJSON(firstItem.denah_url) || [];
        const gambarFiles = tryParseJSON(firstItem.gambar_url) || [];
        const file3dFiles = tryParseJSON(firstItem.file3d_url) || [];
        // Ambil 4 file pertama sebagai hasil desain awal
        const hasil_awal = Object.assign(Object.assign({}, firstItem), { jenis_hasil: "hasil_awal", label: "Hasil Desain Awal", denah_url: JSON.stringify(denahFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)), gambar_url: JSON.stringify(gambarFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)), file3d_url: JSON.stringify(file3dFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)) });
        const revisi = [];
        // Sisa file dari row pertama jadi Revisi ke-1
        const sisaDenah = denahFiles.slice(JUMLAH_FILE_DESAIN_AWAL);
        const sisaGambar = gambarFiles.slice(JUMLAH_FILE_DESAIN_AWAL);
        const sisaFile3d = file3dFiles.slice(JUMLAH_FILE_DESAIN_AWAL);
        if (sisaDenah.length > 0 ||
            sisaGambar.length > 0 ||
            sisaFile3d.length > 0) {
            revisi.push(Object.assign(Object.assign({}, firstItem), { id: `${firstItem.id}-revisi-1`, jenis_hasil: "revisi", revisi_ke: 1, label: "Revisi ke-1", denah_url: JSON.stringify(sisaDenah), gambar_url: JSON.stringify(sisaGambar), file3d_url: JSON.stringify(sisaFile3d) }));
        }
        // Row kedua dan seterusnya tetap dianggap revisi berikutnya
        data.slice(1).forEach((item, index) => {
            revisi.push(Object.assign(Object.assign({}, item), { jenis_hasil: "revisi", revisi_ke: revisi.length + 1, label: `Revisi ke-${revisi.length + 1}` }));
        });
        return res.json({
            hasil_awal,
            revisi,
            total_revisi: revisi.length,
            data,
        });
    });
};
exports.getByPemesananId = getByPemesananId;
// ================= UPDATE STATUS =================
const updateStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db_1.db.query(`UPDATE hasil_desain SET status=? WHERE id=?`, [status, id], (err) => {
        if (err) {
            console.error("🔥 DB ERROR:", err);
            return res.status(500).json({
                message: "Gagal update status",
                error: err.message,
            });
        }
        res.json({ message: "Status updated" });
    });
};
exports.updateStatus = updateStatus;
// ================= GET ALL HASIL DESAIN =================
const getAllHasilDesain = (req, res) => {
    const sql = `SELECT * FROM hasil_desain`;
    db_1.db.query(sql, (err, result) => {
        if (err) {
            console.error("🔥 DB ERROR:", err);
            return res.status(500).json({
                message: "Gagal ambil semua hasil desain",
                error: err.message,
            });
        }
        return res.json(result);
    });
};
exports.getAllHasilDesain = getAllHasilDesain;
const selesaikanProyekSetelahUpload = (pemesanan_id) => {
    db_1.db.query(`UPDATE jadwal SET status = 'selesai' WHERE pemesanan_id = ?`, [pemesanan_id], (err) => {
        if (err) {
            console.warn("Gagal update status jadwal:", err.message);
        }
    });
    db_1.db.query(`UPDATE pemesanan SET status = 'selesai' WHERE id = ?`, [pemesanan_id], (err) => {
        if (err) {
            console.warn("Gagal update status pemesanan:", err.message);
        }
    });
};
//# sourceMappingURL=hasilDesainController.js.map