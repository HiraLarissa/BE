import { Request, Response } from 'express';
import { db } from '../config/db';
import { JadwalPemesanan } from '../models/jadwalPemesanan';
import { insertNotifikasi } from './notifikasiController';

// GET ALL
export const getAllJadwal = (req: Request, res: Response) => {
  db.query('SELECT * FROM jadwal', (err, results) => {
    if (err) return res.status(500).json({ message: err });

    res.json(results);
  });
};

// GET BY ID
export const getJadwalById = (req: Request, res: Response) => {
  const { id } = req.params;

  db.query('SELECT * FROM jadwal WHERE id = ?', [id], (err, results: any) => {
    if (err) return res.status(500).json({ message: err });

    res.json(results[0]);
  });
};

// CREATE
export const createJadwal = (req: Request, res: Response) => {
  const data: JadwalPemesanan = req.body;

  db.query(
    `INSERT INTO jadwal (pemesanan_id, tanggal_mulai, tanggal_selesai, status)
     VALUES (?, ?, ?, ?)`,
    [data.pemesanan_id, data.tanggal_mulai, data.tanggal_selesai || null, data.status],
    (err, result: any) => {
      if (err) return res.status(500).json({ message: err });
      db.query(
        `SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`,
        [data.pemesanan_id],
        (err, rows: any) => {
          if (!err && rows.length > 0) {
            insertNotifikasi(
              rows[0].user_id,
              'Pesanan Mulai Dikerjakan',
              `Pesanan ${rows[0].jenis_bangunan} sudah masuk jadwal pengerjaan.`,
              'jadwal'
            );
          }
        }
      );
      res.status(201).json({
        message: 'Jadwal berhasil dibuat',
        id: result.insertId,
      });
    }
  );
};

// UPDATE
export const updateJadwal = (req: Request, res: Response) => {
  const { id } = req.params;
  const data: JadwalPemesanan = req.body;

  db.query(
    `UPDATE jadwal 
      SET tanggal_mulai=?, tanggal_selesai=?, status=?
      WHERE id=?`,
    [data.tanggal_mulai, data.tanggal_selesai || null, data.status, id],
    (err) => {
      if (err) return res.status(500).json({ message: err });

      res.json({ message: 'Jadwal berhasil diupdate' });
    }
  );
};

// DELETE
export const deleteJadwal = (req: Request, res: Response) => {
  const { id } = req.params;

  db.query('DELETE FROM jadwal WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: err });

    res.json({ message: 'Jadwal berhasil dihapus' });
  });
};

export const startDeadlineNotifCron = () => {
  const checkDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ambil semua jadwal yang belum selesai dan punya tanggal_selesai
    db.query(
      `SELECT j.id, j.pemesanan_id, j.tanggal_selesai, j.status,
              p.jenis_bangunan, p.arsitek_id
       FROM jadwal j
       JOIN pemesanan p ON p.id = j.pemesanan_id
       WHERE j.status != 'selesai'
         AND j.tanggal_selesai IS NOT NULL`,
      (err, rows: any) => {
        if (err) {
          return;
        }

        rows.forEach((row: any) => {
          if (!row.arsitek_id) return;

          const deadline = new Date(row.tanggal_selesai);
          deadline.setHours(0, 0, 0, 0);

          const selisihMs = deadline.getTime() - today.getTime();
          const selisihHari = Math.round(selisihMs / (1000 * 60 * 60 * 24));

          // Kirim notif jika tinggal 3 hari
          if (selisihHari === 3) {
            db.query(
              `SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`,
              [row.arsitek_id, `%${row.jenis_bangunan}%tinggal 3 hari%`],
              (err2, existing: any) => {
                if (err2 || existing.length > 0) return;

                insertNotifikasi(
                  row.arsitek_id,
                  'Deadline Proyek Mendekat',
                  `Proyek ${row.jenis_bangunan} tinggal 3 hari lagi sebelum deadline. Segera selesaikan!`,
                  'deadline'
                );
              }
            );
          }

          // Kirim notif jika tinggal 1 hari
          if (selisihHari === 1) {
            db.query(
              `SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`,
              [row.arsitek_id, `%${row.jenis_bangunan}%tinggal 1 hari%`],
              (err2, existing: any) => {
                if (err2 || existing.length > 0) return;

                insertNotifikasi(
                  row.arsitek_id,
                  'Deadline Besok!',
                  `Proyek ${row.jenis_bangunan} deadline-nya BESOK! Pastikan sudah siap diserahkan.`,
                  'deadline'
                );
              }
            );
          }

          // Kirim notif jika sudah lewat deadline 
          if (selisihHari < 0) {
            db.query(
              `SELECT id FROM notifikasi
               WHERE user_id = ? AND type = 'deadline'
                 AND pesan LIKE ?
                 AND DATE(created_at) = CURDATE()`,
              [row.arsitek_id, `%${row.jenis_bangunan}%melewati deadline%`],
              (err2, existing: any) => {
                if (err2 || existing.length > 0) return;

                insertNotifikasi(
                  row.arsitek_id,
                  'Proyek Melewati Deadline',
                  `Proyek ${row.jenis_bangunan} sudah melewati deadline! Segera hubungi klien.`,
                  'deadline'
                );
              }
            );
          }
        });
      }
    );
  };
  checkDeadlines();

  setInterval(checkDeadlines, 86400000);
};
