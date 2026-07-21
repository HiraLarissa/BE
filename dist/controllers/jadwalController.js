"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDeadlineNotifCron = exports.deleteJadwal = exports.updateJadwal = exports.createJadwal = exports.getJadwalById = exports.getAllJadwal = void 0;
const db_1 = require("../config/db");
const notifikasiController_1 = require("./notifikasiController");
// GET ALL
const getAllJadwal = (req, res) => {
    db_1.db.query("SELECT * FROM jadwal", (err, results) => {
        if (err)
            return res.status(500).json({ message: err });
        res.json(results);
    });
};
exports.getAllJadwal = getAllJadwal;
// GET BY ID
const getJadwalById = (req, res) => {
    const { id } = req.params;
    db_1.db.query("SELECT * FROM jadwal WHERE id = ?", [id], (err, results) => {
        if (err)
            return res.status(500).json({ message: err });
        res.json(results[0]);
    });
};
exports.getJadwalById = getJadwalById;
// CREATE
const createJadwal = (req, res) => {
    const data = req.body;
    db_1.db.query(`INSERT INTO jadwal (pemesanan_id, tanggal_mulai, tanggal_selesai, status)
     VALUES (?, ?, ?, ?)`, [
        data.pemesanan_id,
        data.tanggal_mulai,
        data.tanggal_selesai || null,
        data.status,
    ], (err, result) => {
        if (err)
            return res.status(500).json({ message: err });
        db_1.db.query(`SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`, [data.pemesanan_id], (err, rows) => {
            if (!err && rows.length > 0) {
                (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Pesanan Mulai Dikerjakan", `Pesanan ${rows[0].jenis_bangunan} sudah masuk jadwal pengerjaan.`, "jadwal");
            }
        });
        res.status(201).json({
            message: "Jadwal berhasil dibuat",
            id: result.insertId,
        });
    });
};
exports.createJadwal = createJadwal;
// UPDATE
const updateJadwal = (req, res) => {
    const { id } = req.params;
    const data = req.body;
    db_1.db.query(`UPDATE jadwal 
      SET tanggal_mulai=?, tanggal_selesai=?, status=?
      WHERE id=?`, [
        data.tanggal_mulai,
        data.tanggal_selesai || null,
        data.status,
        id,
    ], (err) => {
        if (err)
            return res.status(500).json({ message: err });
        res.json({ message: "Jadwal berhasil diupdate" });
    });
};
exports.updateJadwal = updateJadwal;
// DELETE
const deleteJadwal = (req, res) => {
    const { id } = req.params;
    db_1.db.query("DELETE FROM jadwal WHERE id = ?", [id], (err) => {
        if (err)
            return res.status(500).json({ message: err });
        res.json({ message: "Jadwal berhasil dihapus" });
    });
};
exports.deleteJadwal = deleteJadwal;
const startDeadlineNotifCron = () => {
    const checkDeadlines = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Ambil semua jadwal yang belum selesai dan punya tanggal_selesai
        db_1.db.query(`SELECT j.id, j.pemesanan_id, j.tanggal_selesai, j.status,
              p.jenis_bangunan, p.arsitek_id
       FROM jadwal j
       JOIN pemesanan p ON p.id = j.pemesanan_id
       WHERE j.status != 'selesai'
         AND j.tanggal_selesai IS NOT NULL`, (err, rows) => {
            if (err) {
                console.error("[CRON] Gagal ambil jadwal:", err);
                return;
            }
            rows.forEach((row) => {
                if (!row.arsitek_id)
                    return;
                const deadline = new Date(row.tanggal_selesai);
                deadline.setHours(0, 0, 0, 0);
                const selisihMs = deadline.getTime() - today.getTime();
                const selisihHari = Math.round(selisihMs / (1000 * 60 * 60 * 24));
                // Kirim notif jika tinggal 3 hari
                if (selisihHari === 3) {
                    // Cek duplikat: jangan kirim notif yang sama 2x di hari yang sama
                    db_1.db.query(`SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`, [row.arsitek_id, `%${row.jenis_bangunan}%tinggal 3 hari%`], (err2, existing) => {
                        if (err2 || existing.length > 0)
                            return;
                        (0, notifikasiController_1.insertNotifikasi)(row.arsitek_id, "Deadline Proyek Mendekat", `Proyek ${row.jenis_bangunan} tinggal 3 hari lagi sebelum deadline. Segera selesaikan!`, "deadline");
                        console.log(`[CRON] Notif 3 hari dikirim → arsitek_id ${row.arsitek_id}, proyek: ${row.jenis_bangunan}`);
                    });
                }
                // Kirim notif jika tinggal 1 hari
                if (selisihHari === 1) {
                    db_1.db.query(`SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`, [row.arsitek_id, `%${row.jenis_bangunan}%tinggal 1 hari%`], (err2, existing) => {
                        if (err2 || existing.length > 0)
                            return;
                        (0, notifikasiController_1.insertNotifikasi)(row.arsitek_id, "Deadline Besok!", `Proyek ${row.jenis_bangunan} deadline-nya BESOK! Pastikan sudah siap diserahkan.`, "deadline");
                        console.log(`[CRON] Notif 1 hari dikirim → arsitek_id ${row.arsitek_id}, proyek: ${row.jenis_bangunan}`);
                    });
                }
                // Kirim notif jika sudah lewat deadline (hari ini > deadline)
                if (selisihHari < 0) {
                    db_1.db.query(`SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`, [row.arsitek_id, `%${row.jenis_bangunan}%melewati deadline%`], (err2, existing) => {
                        if (err2 || existing.length > 0)
                            return;
                        (0, notifikasiController_1.insertNotifikasi)(row.arsitek_id, "Proyek Melewati Deadline", `Proyek ${row.jenis_bangunan} sudah melewati deadline! Segera hubungi klien.`, "deadline");
                        console.log(`[CRON] Notif lewat deadline dikirim → arsitek_id ${row.arsitek_id}, proyek: ${row.jenis_bangunan}`);
                    });
                }
            });
        });
    };
    // Jalankan langsung saat server start
    checkDeadlines();
    // Ulangi tiap 24 jam (86400000 ms)
    setInterval(checkDeadlines, 86400000);
    console.log("[CRON] Deadline notif scheduler aktif ✓");
};
exports.startDeadlineNotifCron = startDeadlineNotifCron;
//# sourceMappingURL=jadwalController.js.map