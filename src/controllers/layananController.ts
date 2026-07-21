import { Request, Response } from 'express';
import { db } from '../config/db';
import { Layanan } from '../models/layananModel';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { upload } from '../middleware/upload';

export { upload };

const normalize = (val: string | null | undefined) => {
  if (!val) return null;
  return val.toLowerCase().trim();
};

// GET ALL
export const getAllLayanan = async (req: Request, res: Response) => {
  try {
    db.query('SELECT * FROM layanan', (err, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal mengambil data layanan' });
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};

// GET BY ID
export const getLayananById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.query('SELECT * FROM layanan WHERE id = ?', [id], (err, rows: RowDataPacket[]) => {
      if (err) {
        return res.status(500).json({ message: 'Error server' });
      }
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Layanan tidak ditemukan' });
      }
      res.json(rows[0]);
    });
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};

// CREATE
export const createLayanan = async (req: Request, res: Response) => {
  try {
    const {
      nama_layanan,
      deskripsi,
      harga,
      luas,
      kamar,
      lantai,
      area,
      ruangan,
      jenis_bangunan,
      konsep_desain,
    } = req.body;

    const gambar = req.file ? req.file.filename : null;
    const jenisFix = normalize(jenis_bangunan);
    const konsepFix = normalize(konsep_desain);

    if (!nama_layanan || !harga) {
      return res.status(400).json({ message: 'Data wajib diisi' });
    }

    db.query(
      `INSERT INTO layanan 
      (nama_layanan, deskripsi, harga, gambar, luas, kamar, lantai, area, ruangan, jenis_bangunan, konsep_desain) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_layanan,
        deskripsi,
        harga,
        gambar,
        luas || null,
        kamar || null,
        lantai || null,
        area || null,
        ruangan || null,
        jenisFix,
        konsepFix,
      ],
      (err, result: any) => {
        if (err) {
          return res.status(500).json({ message: 'Gagal menambah layanan' });
        }
        return res.status(201).json({
          message: 'Layanan berhasil ditambahkan',
          id: result.insertId,
          gambar,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};

// UPDATE
export const updateLayanan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nama_layanan,
      deskripsi,
      harga,
      luas,
      kamar,
      lantai,
      area,
      ruangan,
      jenis_bangunan,
      konsep_desain,
    } = req.body;

    const gambar = req.file?.filename;

    let query = 'UPDATE layanan SET ';
    let values: (string | number)[] = [];

    if (nama_layanan) {
      query += 'nama_layanan=?, ';
      values.push(nama_layanan);
    }
    if (deskripsi) {
      query += 'deskripsi=?, ';
      values.push(deskripsi);
    }
    if (harga) {
      query += 'harga=?, ';
      values.push(harga);
    }
    if (gambar) {
      query += 'gambar=?, ';
      values.push(gambar);
    }
    if (luas) {
      query += 'luas=?, ';
      values.push(luas);
    }
    if (kamar) {
      query += 'kamar=?, ';
      values.push(kamar);
    }
    if (lantai) {
      query += 'lantai=?, ';
      values.push(lantai);
    }
    if (area) {
      query += 'area=?, ';
      values.push(area);
    }
    if (ruangan) {
      query += 'ruangan=?, ';
      values.push(ruangan);
    }
    if (jenis_bangunan !== undefined) {
      query += 'jenis_bangunan=?, ';
      values.push(jenis_bangunan || null);
    }
    if (konsep_desain) {
      query += 'konsep_desain=?, ';
      values.push(konsep_desain);
    }

    if (values.length === 0) {
      return res.status(400).json({ message: 'Tidak ada data yang diupdate' });
    }

    query = query.replace(/,\s*$/, '');
    query += ' WHERE id=?';
    values.push(Number(id));

    db.query(query, values, (err, result: ResultSetHeader) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal update layanan' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Layanan tidak ditemukan' });
      }
      res.json({ message: 'Update berhasil' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};

// DELETE
export const deleteLayanan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.query('DELETE FROM layanan WHERE id=?', [id], (err, result: ResultSetHeader) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal hapus layanan' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Layanan tidak ditemukan' });
      }
      res.json({ message: 'Layanan berhasil dihapus' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error server' });
  }
};
