import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

// ================= HELPER: INSERT NOTIFIKASI =================
export const insertNotifikasi = (user_id: number, judul: string, pesan: string, type: string) => {
  db.query(
    `INSERT INTO notifikasi (user_id, judul, pesan, type) VALUES (?, ?, ?, ?)`,
    [user_id, judul, pesan, type],
    (err) => {
      if (err) console.error('NOTIF ERROR:', err);
    }
  );
};

// ================= GET NOTIFIKASI USER =================
export const getNotifikasi = (req: AuthRequest, res: Response) => {
  const user_id = req.user?.id;

  db.query(
    `SELECT * FROM notifikasi WHERE user_id = ? ORDER BY created_at DESC`,
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Gagal ambil notifikasi' });
      res.json(results);
    }
  );
};

// ================= MARK AS READ =================
export const markAsRead = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.id;

  db.query(
    `UPDATE notifikasi SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [id, user_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Gagal update' });
      res.json({ message: 'Notifikasi dibaca' });
    }
  );
};

// ================= MARK ALL AS READ =================
export const markAllAsRead = (req: AuthRequest, res: Response) => {
  const user_id = req.user?.id;

  db.query(`UPDATE notifikasi SET is_read = 1 WHERE user_id = ?`, [user_id], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal update' });
    res.json({ message: 'Semua notifikasi dibaca' });
  });
};

// ================= DELETE NOTIFIKASI =================
export const deleteNotifikasi = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user_id = req.user?.id;

  db.query(`DELETE FROM notifikasi WHERE id = ? AND user_id = ?`, [id, user_id], (err) => {
    if (err) return res.status(500).json({ message: 'Gagal hapus' });
    res.json({ message: 'Notifikasi dihapus' });
  });
};
