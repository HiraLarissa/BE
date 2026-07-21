import { Request, Response } from 'express';
import { HasilDesain } from '../models/hasilDesain';
import { db } from '../config/db';
import { insertNotifikasi } from './notifikasiController';

// ================= CREATE / UPLOAD =================
export const createHasilDesain = (req: Request, res: Response) => {
  const { pemesanan_id, keterangan } = req.body;
  const files = req.files as any;
  const denahFiles = files?.denah?.map((f: any) => f.filename) || [];
  const gambarFiles = files?.gambar?.map((f: any) => f.filename) || [];
  const file3dFiles = files?.file3d?.map((f: any) => f.filename) || [];
  const denah = denahFiles.length > 0 ? JSON.stringify(denahFiles) : null;
  const gambar = gambarFiles.length > 0 ? JSON.stringify(gambarFiles) : null;
  const file3d = file3dFiles.length > 0 ? JSON.stringify(file3dFiles) : null;

  const status = denah && gambar && file3d ? 'selesai' : 'proses';

  const sql = `
    INSERT INTO hasil_desain 
    (pemesanan_id, keterangan, denah_url, gambar_url, file3d_url, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [pemesanan_id, keterangan || null, denah, gambar, file3d, status],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Gagal upload', error: err.message });

      db.query(
        `SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`,
        [pemesanan_id],
        (err, rows: any) => {
          if (!err && rows.length > 0) {
            insertNotifikasi(
              rows[0].user_id,
              'Hasil Desain Tersedia',
              `Hasil desain untuk ${rows[0].jenis_bangunan} sudah diupload.`,
              'hasil_desain'
            );
          }

          selesaikanProyekSetelahUpload(pemesanan_id);
        }
      );

      return res.json({
        success: true,
        message: 'Hasil desain berhasil dikirim ke klien dan masuk ke riwayat proyek.',
        status,
        id: (result as any).insertId,
      });
    }
  );
};

// ================= APPEND / UPLOAD REVISI =================
export const appendHasilDesain = (req: Request, res: Response) => {
  const { pemesanan_id, keterangan } = req.body;
  const files = req.files as any;

  const denahFiles = files?.denah?.map((f: any) => f.filename) || [];
  const gambarFiles = files?.gambar?.map((f: any) => f.filename) || [];
  const file3dFiles = files?.file3d?.map((f: any) => f.filename) || [];

  const denah = denahFiles.length > 0 ? JSON.stringify(denahFiles) : null;
  const gambar = gambarFiles.length > 0 ? JSON.stringify(gambarFiles) : null;
  const file3d = file3dFiles.length > 0 ? JSON.stringify(file3dFiles) : null;

  const status = denah && gambar && file3d ? 'selesai' : 'proses';

  db.query(
    `SELECT COUNT(*) AS total FROM hasil_desain WHERE pemesanan_id = ?`,
    [pemesanan_id],
    (err, rows: any) => {
      if (err) {
        return res.status(500).json({
          message: 'Gagal menghitung hasil desain',
          error: err.message,
        });
      }

      const totalData = rows[0]?.total || 0;

      const revisiKe = totalData;

      const keteranganFinal = keterangan || `Revisi ke-${revisiKe}`;

      const sql = `
        INSERT INTO hasil_desain 
        (pemesanan_id, keterangan, denah_url, gambar_url, file3d_url, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [pemesanan_id, keteranganFinal, denah, gambar, file3d, status],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              message: 'Gagal upload revisi',
              error: err.message,
            });
          }

          db.query(
            `SELECT user_id, jenis_bangunan FROM pemesanan WHERE id = ?`,
            [pemesanan_id],
            (err, rows: any) => {
              if (!err && rows.length > 0) {
                insertNotifikasi(
                  rows[0].user_id,
                  'Revisi Desain Tersedia',
                  `Revisi desain untuk ${rows[0].jenis_bangunan} sudah diupload.`,
                  'hasil_desain'
                );
              }

              selesaikanProyekSetelahUpload(pemesanan_id);
            }
          );

          return res.json({
            success: true,
            message: `Revisi ke-${revisiKe} berhasil dikirim ke klien dan masuk ke riwayat proyek.`,
            status,
            id: (result as any).insertId,
            revisi_ke: revisiKe,
          });
        }
      );
    }
  );
};

function tryParseJSON(val: any) {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return val ? [val] : null;
  } 
}

// ================= GET BY PEMESANAN =================
export const getByPemesananId = (req: Request, res: Response) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM hasil_desain 
    WHERE pemesanan_id = ?
    ORDER BY created_at ASC, id ASC
  `;

  db.query(sql, [id], (err, result: any) => {
    if (err) {
      return res.status(500).json({
        message: 'Gagal ambil data',
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

    const hasil_awal = {
      ...firstItem,
      jenis_hasil: 'hasil_awal',
      label: 'Hasil Desain Awal',
      denah_url: JSON.stringify(denahFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)),
      gambar_url: JSON.stringify(gambarFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)),
      file3d_url: JSON.stringify(file3dFiles.slice(0, JUMLAH_FILE_DESAIN_AWAL)),
    };

    const revisi: any[] = [];

    const sisaDenah = denahFiles.slice(JUMLAH_FILE_DESAIN_AWAL);
    const sisaGambar = gambarFiles.slice(JUMLAH_FILE_DESAIN_AWAL);
    const sisaFile3d = file3dFiles.slice(JUMLAH_FILE_DESAIN_AWAL);

    if (sisaDenah.length > 0 || sisaGambar.length > 0 || sisaFile3d.length > 0) {
      revisi.push({
        ...firstItem,
        id: `${firstItem.id}-revisi-1`,
        jenis_hasil: 'revisi',
        revisi_ke: 1,
        label: 'Revisi ke-1',
        denah_url: JSON.stringify(sisaDenah),
        gambar_url: JSON.stringify(sisaGambar),
        file3d_url: JSON.stringify(sisaFile3d),
      });
    }

    data.slice(1).forEach((item: any, index: number) => {
      revisi.push({
        ...item,
        jenis_hasil: 'revisi',
        revisi_ke: revisi.length + 1,
        label: `Revisi ke-${revisi.length + 1}`,
      });
    });

    return res.json({
      hasil_awal,
      revisi,
      total_revisi: revisi.length,
      data,
    });
  });
};

// ================= UPDATE STATUS =================
export const updateStatus = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(`UPDATE hasil_desain SET status=? WHERE id=?`, [status, id], (err) => {
    if (err) {
      return res.status(500).json({
        message: 'Gagal update status',
        error: err.message,
      });
    }

    res.json({ message: 'Status updated' });
  });
};

// ================= GET ALL HASIL DESAIN =================
export const getAllHasilDesain = (req: Request, res: Response) => {
  const sql = `SELECT * FROM hasil_desain`;

  db.query(sql, (err, result: any) => {
    if (err) {
      return res.status(500).json({
        message: 'Gagal ambil semua hasil desain',
        error: err.message,
      });
    }

    return res.json(result);
  });
};

const selesaikanProyekSetelahUpload = (pemesanan_id: any) => {
  db.query(`UPDATE jadwal SET status = 'selesai' WHERE pemesanan_id = ?`, [pemesanan_id], (err) => {
    if (err) {
    }
  });

  db.query(`UPDATE pemesanan SET status = 'selesai' WHERE id = ?`, [pemesanan_id], (err) => {
    if (err) {
    }
  });
};
