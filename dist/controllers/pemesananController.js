"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailablePemesanan = exports.deletePemesanan = exports.updatePemesanan = exports.createPemesanan = exports.getPemesananById = exports.getPemesananKlien = exports.getAllPemesanan = void 0;
const db_1 = require("../config/db");
const notifikasiController_1 = require("./notifikasiController");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
// ================= GET ALL =================
const getAllPemesanan = (req, res) => {
    db_1.db.query(`SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC`, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Gagal ambil data" });
        }
        const result = rows.map((item) => (Object.assign(Object.assign({}, item), { gambar: item.gambar
                ? `${BASE_URL}/uploads/${item.gambar}`
                : null, gambar_rekomendasi: item.gambar_rekomendasi
                ? item.gambar_rekomendasi.startsWith("http")
                    ? item.gambar_rekomendasi
                    : `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
                : null })));
        return res.json(result);
    });
};
exports.getAllPemesanan = getAllPemesanan;
// ================= GET PEMESANAN KLIEN LOGIN =================
const getPemesananKlien = (req, res) => {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
    db_1.db.query(`SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.id DESC`, [userId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Gagal ambil data",
            });
        }
        const result = rows.map((item) => (Object.assign(Object.assign({}, item), { gambar: item.gambar
                ? `${BASE_URL}/uploads/${item.gambar}`
                : null, gambar_rekomendasi: item.gambar_rekomendasi
                ? item.gambar_rekomendasi.startsWith("http")
                    ? item.gambar_rekomendasi
                    : `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
                : null })));
        return res.json(result);
    });
};
exports.getPemesananKlien = getPemesananKlien;
// ================= GET BY ID =================
const getPemesananById = (req, res) => {
    const { id } = req.params;
    db_1.db.query(`SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`, [id], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error server" });
        }
        if (rows.length === 0) {
            return res.status(404).json({ message: "Data tidak ditemukan" });
        }
        const item = rows[0];
        const result = Object.assign(Object.assign({}, item), { gambar: item.gambar
                ? `${BASE_URL}/uploads/${item.gambar}`
                : null, gambar_rekomendasi: item.gambar_rekomendasi
                ? `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
                : null });
        return res.json(result);
    });
};
exports.getPemesananById = getPemesananById;
// ================= CREATE =================
const createPemesanan = (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const data = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({ message: "User tidak valid" });
    }
    try {
        // ================= SAFE CONVERT =================
        const luas = Number(data.luas_lahan) || 0;
        const lantai = Number(data.jumlah_lantai) || 0;
        const ruangan = Number(data.jumlah_ruangan) || 0;
        const estimasi = Number(data.estimasi_anggaran) || 0;
        const jenis_bangunan = (_b = data.jenis_bangunan) !== null && _b !== void 0 ? _b : "-";
        const konsep_desain = (_c = data.konsep_desain) !== null && _c !== void 0 ? _c : "-";
        const kebutuhan_khusus = (_d = data.kebutuhan_khusus) !== null && _d !== void 0 ? _d : "-";
        const source = (_e = data.source) !== null && _e !== void 0 ? _e : "kebutuhan";
        // ================= FILE =================
        const files = req.files;
        const gambar = (_h = (_g = (_f = files === null || files === void 0 ? void 0 : files.gambar) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.filename) !== null && _h !== void 0 ? _h : null;
        const gambar_rekomendasi = (_m = (_l = (_k = (_j = files === null || files === void 0 ? void 0 : files.gambar_rekomendasi) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.filename) !== null && _l !== void 0 ? _l : req.body.gambar_rekomendasi) !== null && _m !== void 0 ? _m : null;
        // gambar_rekomendasi tidak dipakai di create (biar konsisten)
        const status = "pending";
        // ================= VALIDASI =================
        if (!jenis_bangunan || !konsep_desain) {
            return res.status(400).json({ message: "Data tidak lengkap" });
        }
        // ================= HITUNG =================
        const harga_final = estimasi > 0
            ? estimasi
            : luas * 2500 + lantai * 100000 + ruangan * 50000;
        // ================= INSERT =================
        db_1.db.query(`INSERT INTO pemesanan 
      (user_id, jenis_bangunan, luas_lahan, jumlah_lantai, jumlah_ruangan, konsep_desain, estimasi_anggaran, kebutuhan_khusus, status, source, harga_final, gambar, gambar_rekomendasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            jenis_bangunan,
            luas,
            lantai,
            ruangan,
            konsep_desain,
            estimasi,
            kebutuhan_khusus,
            status,
            source,
            harga_final,
            gambar,
            gambar_rekomendasi
        ], (err, result) => {
            if (err) {
                console.error("DB ERROR:", err);
                return res.status(500).json({
                    message: "Gagal create",
                    error: err.message,
                });
            }
            // Notifikasi ke klien
            (0, notifikasiController_1.insertNotifikasi)(userId, "Pesanan Berhasil Dibuat", `Pesanan ${jenis_bangunan} berhasil dibuat. Silakan lakukan pembayaran.`, "pesanan");
            // Notifikasi ke arsitek
            db_1.db.query(`SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`, (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].id, "Pesanan Masuk Baru", `Ada pesanan baru: ${jenis_bangunan} masuk dari klien.`, "pesanan");
                }
            });
            return res.status(201).json({
                message: "Pemesanan berhasil dibuat",
                id: result.insertId,
                harga_final,
                gambar: gambar ? `${BASE_URL}/uploads/${gambar}` : null,
                gambar_rekomendasi,
            });
        });
    }
    catch (error) {
        console.error("SERVER ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.createPemesanan = createPemesanan;
// ================= UPDATE =================
const updatePemesanan = (req, res) => {
    var _a, _b, _c;
    const { id } = req.params;
    console.log("BODY:", req.body);
    const status = req.body.status || null;
    const rawHarga = req.body.harga_final;
    const hargaFix = rawHarga === undefined ||
        rawHarga === null ||
        rawHarga === "" ||
        isNaN(Number(rawHarga))
        ? null
        : Number(rawHarga);
    const files = req.files || {};
    const gambar_rekomendasi = (_c = (_b = (_a = files === null || files === void 0 ? void 0 : files.gambar_rekomendasi) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.filename) !== null && _c !== void 0 ? _c : null;
    let query = `
    UPDATE pemesanan
    SET
      status = COALESCE(?, status),
      harga_final = COALESCE(?, harga_final),
      gambar_rekomendasi = COALESCE(?, gambar_rekomendasi)
    WHERE id = ?
  `;
    const values = [
        status,
        hargaFix,
        gambar_rekomendasi,
        id,
    ];
    db_1.db.query(query, values, (err) => {
        if (err) {
            console.log("DB ERROR:", err);
            return res.status(500).json({
                message: "Gagal update",
            });
        }
        return res.json({
            message: "Berhasil update",
        });
    });
};
exports.updatePemesanan = updatePemesanan;
// ================= DELETE =================
const deletePemesanan = (req, res) => {
    const { id } = req.params;
    // 1. hapus dulu pembayaran yang terkait
    db_1.db.query("DELETE FROM pembayaran WHERE pemesanan_id = ?", [id], (err) => {
        if (err) {
            return res.status(500).json({ message: "Gagal delete pembayaran" });
        }
        // 2. baru hapus pemesanan
        db_1.db.query("DELETE FROM pemesanan WHERE id = ?", [id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Gagal delete pemesanan" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Data tidak ditemukan" });
            }
            return res.json({ message: "Data berhasil dihapus" });
        });
    });
};
exports.deletePemesanan = deletePemesanan;
// ================= GET AVAILABLE (BELUM MASUK JADWAL) =================
const getAvailablePemesanan = (req, res) => {
    db_1.db.query(`SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN jadwal j ON j.pemesanan_id = p.id
    WHERE j.id IS NULL
    ORDER BY p.id DESC`, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Gagal ambil data" });
        }
        const result = rows.map((item) => (Object.assign(Object.assign({}, item), { gambar: item.gambar
                ? `${BASE_URL}/uploads/${item.gambar}`
                : null, gambar_rekomendasi: item.gambar_rekomendasi
                ? `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
                : null })));
        return res.json(result);
    });
};
exports.getAvailablePemesanan = getAvailablePemesanan;
//# sourceMappingURL=pemesananController.js.map