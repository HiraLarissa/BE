import { Request, Response } from 'express';
import { db } from '../config/db';
import { insertNotifikasi } from './notifikasiController';

// ================= TAMBAH REVISI =================
export const createRevisi = (req: Request, res: Response) => {
  const { pemesanan_id, jenis_revisi, catatan } = req.body;
  const file = (req as any).file?.filename || null;

  db.query(
    'SELECT COUNT(*) as total FROM revisi WHERE pemesanan_id = ?',
    [pemesanan_id],
    (err, results: any) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal hitung revisi' });
      }

      const revisi_ke = results[0].total + 1;

      db.query(
        `INSERT INTO revisi 
        (pemesanan_id, jenis_revisi, catatan, file_referensi, status, revisi_ke)
        VALUES (?, ?, ?, ?, 'menunggu', ?)`,
        [pemesanan_id, jenis_revisi, catatan, file, revisi_ke],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Gagal tambah revisi' });
          }
          db.query(`SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`, (err, rows: any) => {
            if (!err && rows.length > 0) {
              insertNotifikasi(
                rows[0].id,
                'Permintaan Revisi Baru',
                `Ada permintaan revisi baru #${revisi_ke} untuk pemesanan #${pemesanan_id}.`,
                'revisi'
              );
            }
          });

          // Notifikasi ke klien
          db.query(
            `SELECT user_id FROM pemesanan WHERE id = ?`,
            [pemesanan_id],
            (err, rows: any) => {
              if (!err && rows.length > 0) {
                insertNotifikasi(
                  rows[0].user_id,
                  'Revisi Berhasil Diajukan',
                  `Permintaan revisi #${revisi_ke} berhasil diajukan. Menunggu diproses oleh arsitek.`,
                  'revisi'
                );
              }
            }
          );

          res.json({ message: 'Revisi berhasil diajukan' });
        }
      );
    }
  );
};

// ================= GET REVISI =================
export const getRevisi = (req: Request, res: Response) => {
  db.query(`SELECT r.* FROM revisi r ORDER BY r.id DESC`, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal ambil data revisi' });
    }

    res.json(results);
  });
};
// ================= GET REVISI BY PEMESANAN =================
export const getRevisiByPemesanan = (req: Request, res: Response) => {
  const { pemesanan_id } = req.params;

  db.query(
    `SELECT * FROM revisi WHERE pemesanan_id = ? ORDER BY id DESC`,
    [pemesanan_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal ambil revisi' });
      }
      res.json(results);
    }
  );
};

// ================= UPDATE STATUS =================
export const updateStatusRevisi = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query('UPDATE revisi SET status = ? WHERE id = ?', [status, id], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal update status' });
    }
    if (status === 'selesai') {
      db.query(
        `SELECT p.user_id, p.jenis_bangunan FROM pemesanan p
           INNER JOIN revisi r ON r.pemesanan_id = p.id
           WHERE r.id = ?`,
        [id],
        (err, rows: any) => {
          if (!err && rows.length > 0) {
            insertNotifikasi(
              rows[0].user_id,
              'Revisi Selesai Dikerjakan',
              `Revisi untuk ${rows[0].jenis_bangunan} telah selesai dikerjakan. Silakan cek hasilnya.`,
              'revisi'
            );
          }
        }
      );
    }

    res.json({ message: 'Status revisi diupdate' });
  });
};
