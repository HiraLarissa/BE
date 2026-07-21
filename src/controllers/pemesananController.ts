import { Request, Response } from 'express';
import { db } from '../config/db';
import { RowDataPacket, ResultSetHeader, QueryError } from 'mysql2';
import { AuthRequest } from '../middleware/authMiddleware';
import { insertNotifikasi } from './notifikasiController';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// ================= GET ALL =================
export const getAllPemesanan = (req: Request, res: Response) => {
  db.query(
    `SELECT
      p.*,
      u.nama AS nama_user,
      u.email AS email_user
  FROM pemesanan p
  LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC`,
    (err: QueryError | null, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal ambil data' });
      }

      const result = rows.map((item: any) => ({
        ...item,
        gambar: item.gambar ? `${BASE_URL}/uploads/${item.gambar}` : null,
        gambar_rekomendasi: item.gambar_rekomendasi
          ? item.gambar_rekomendasi.startsWith('http')
            ? item.gambar_rekomendasi
            : `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
          : null,
      }));

      return res.json(result);
    }
  );
};

// ================= GET PEMESANAN KLIEN LOGIN =================
export const getPemesananKlien = (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: 'Unauthorized',
    });
  }

  db.query(
    `SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.id DESC`,
    [userId],
    (err: QueryError | null, rows: RowDataPacket[]) => {
      if (err) {

        return res.status(500).json({
          message: 'Gagal ambil data',
        });
      }

      const result = rows.map((item: any) => ({
        ...item,

        gambar: item.gambar ? `${BASE_URL}/uploads/${item.gambar}` : null,

        gambar_rekomendasi: item.gambar_rekomendasi
          ? item.gambar_rekomendasi.startsWith('http')
            ? item.gambar_rekomendasi
            : `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
          : null,
      }));

      return res.json(result);
    }
  );
};

// ================= GET BY ID =================
export const getPemesananById = (req: Request, res: Response) => {
  const { id } = req.params;

  db.query(
    `SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?`,
    [id],
    (err: QueryError | null, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Error server' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Data tidak ditemukan' });
      }

      const item = rows[0]!;

      const result = {
        ...item,
        gambar: item.gambar ? `${BASE_URL}/uploads/${item.gambar}` : null,
        gambar_rekomendasi: item.gambar_rekomendasi
          ? `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
          : null,
      };

      return res.json(result);
    }
  );
};

// ================= CREATE =================
export const createPemesanan = (req: AuthRequest, res: Response) => {
  const data = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'User tidak valid' });
  }

  try {
    const luas = Number(data.luas_lahan) || 0;
    const lantai = Number(data.jumlah_lantai) || 0;
    const ruangan = Number(data.jumlah_ruangan) || 0;
    const estimasi = Number(data.estimasi_anggaran) || 0;
    const jenis_bangunan = data.jenis_bangunan ?? '-';
    const konsep_desain = data.konsep_desain ?? '-';
    const kebutuhan_khusus = data.kebutuhan_khusus ?? '-';
    const source = data.source ?? 'kebutuhan';
    const files = req.files as any;
    const gambar = files?.gambar?.[0]?.filename ?? null;
    const gambar_rekomendasi =
      files?.gambar_rekomendasi?.[0]?.filename ?? req.body.gambar_rekomendasi ?? null;
    const status = 'pending';

    // VALIDASI 
    if (!jenis_bangunan || !konsep_desain) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // HITUNG 
    const harga_final = estimasi > 0 ? estimasi : luas * 2500 + lantai * 100000 + ruangan * 50000;

    db.query(
      `INSERT INTO pemesanan 
      (user_id, jenis_bangunan, luas_lahan, jumlah_lantai, jumlah_ruangan, konsep_desain, estimasi_anggaran, kebutuhan_khusus, status, source, harga_final, gambar, gambar_rekomendasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        gambar_rekomendasi,
      ],
      (err: QueryError | null, result: ResultSetHeader) => {
        if (err) {

          return res.status(500).json({
            message: 'Gagal create',
            error: err.message,
          });
        }
        // Notifikasi ke klien
        insertNotifikasi(
          userId,
          'Pesanan Berhasil Dibuat',
          `Pesanan ${jenis_bangunan} berhasil dibuat. Silakan lakukan pembayaran.`,
          'pesanan'
        );

        // Notifikasi ke arsitek
        db.query(`SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`, (err, rows: any) => {
          if (!err && rows.length > 0) {
            insertNotifikasi(
              rows[0].id,
              'Pesanan Masuk Baru',
              `Ada pesanan baru: ${jenis_bangunan} masuk dari klien.`,
              'pesanan'
            );
          }
        });

        return res.status(201).json({
          message: 'Pemesanan berhasil dibuat',
          id: result.insertId,
          harga_final,
          gambar: gambar ? `${BASE_URL}/uploads/${gambar}` : null,
          gambar_rekomendasi,
        });
      }
    );
  } catch (error: any) {

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};

// ================= UPDATE =================
export const updatePemesanan = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const status = req.body.status || null;
  const rawHarga = req.body.harga_final;
  const hargaFix =
    rawHarga === undefined || rawHarga === null || rawHarga === '' || isNaN(Number(rawHarga))
      ? null
      : Number(rawHarga);
  const files = (req as any).files || {};
  const gambar_rekomendasi = files?.gambar_rekomendasi?.[0]?.filename ?? null;

  let query = `
    UPDATE pemesanan
    SET
      status = COALESCE(?, status),
      harga_final = COALESCE(?, harga_final),
      gambar_rekomendasi = COALESCE(?, gambar_rekomendasi)
    WHERE id = ?
  `;

  const values = [status, hargaFix, gambar_rekomendasi, id];

  db.query(query, values, (err) => {
    if (err) {
      return res.status(500).json({
        message: 'Gagal update',
      });
    }

    return res.json({
      message: 'Berhasil update',
    });
  });
};

// ================= DELETE =================
export const deletePemesanan = (req: Request, res: Response) => {
  const { id } = req.params;

  db.query(
    `SELECT status FROM pemesanan WHERE id = ?`,
    [id],
    (err: QueryError | null, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal cek status pesanan' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Data tidak ditemukan' });
      }

      const status = rows[0]!.status;
      if (status !== 'pending') {
        return res.status(400).json({
          message: 'Pesanan yang sudah dibayar atau sedang berjalan tidak bisa dihapus',
        });
      }

      db.query('DELETE FROM pembayaran WHERE pemesanan_id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Gagal delete pembayaran' });
        }

        db.query(
          'DELETE FROM pemesanan WHERE id = ?',
          [id],
          (err: QueryError | null, result: ResultSetHeader) => {
            if (err) {
              return res.status(500).json({ message: 'Gagal delete pemesanan' });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: 'Data tidak ditemukan' });
            }

            return res.json({ message: 'Data berhasil dihapus' });
          }
        );
      });
    }
  );
};
// ================= GET AVAILABLE (BELUM MASUK JADWAL) =================
export const getAvailablePemesanan = (req: Request, res: Response) => {
  db.query(
    `SELECT 
      p.*, 
      u.nama AS nama_user,
      u.email AS email_user
    FROM pemesanan p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN jadwal j ON j.pemesanan_id = p.id
    WHERE j.id IS NULL
    ORDER BY p.id DESC`,
    (err: QueryError | null, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal ambil data' });
      }

      const result = rows.map((item: any) => ({
        ...item,
        gambar: item.gambar ? `${BASE_URL}/uploads/${item.gambar}` : null,
        gambar_rekomendasi: item.gambar_rekomendasi
          ? `${BASE_URL}/uploads/${item.gambar_rekomendasi}`
          : null,
      }));

      return res.json(result);
    }
  );
};
