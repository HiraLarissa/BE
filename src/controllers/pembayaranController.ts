import { Request, Response } from 'express';
import { snap, coreApi } from '../config/midtrans';
import { db } from '../config/db';
import { Pembayaran } from '../models/pembayaranModel';
import { ResultSetHeader } from 'mysql2';
import { insertNotifikasi } from './notifikasiController';

// CREATE PAYMENT
export const createPayment = async (req: Request, res: Response) => {
  try {
    const { pemesanan_id, metode } = req.body;

    if (!pemesanan_id) {
      return res.status(400).json({
        message: 'Pemesanan tidak ditemukan',
      });
    }

    // AMBIL DATA PEMESANAN 
    const pemesanan: any = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM pemesanan WHERE id = ? LIMIT 1`, [pemesanan_id], (err, rows: any) => {
        if (err) return reject(err);

        if (!rows.length) {
          return reject(new Error('Pemesanan tidak ditemukan'));
        }

        resolve(rows[0]);
      });
    });

    // HARGA FINAL 
    const hargaFinal = Number(pemesanan.harga_final || 0);

    const biayaLayanan = 100000;

    const total = hargaFinal + biayaLayanan;

    if (total <= 0) {
      return res.status(400).json({
        message: 'Total pembayaran tidak valid',
      });
    }

    const order_id = 'ORDER-' + Date.now();

    // PAYMENT METHOD 
    let enabled_payments: string[] = [];

    if (metode === 'transfer') {
      enabled_payments = ['bank_transfer'];
    } else if (metode === 'ewallet') {
      enabled_payments = ['gopay'];
    } else if (metode === 'virtual') {
      enabled_payments = ['bank_transfer'];
    }

    // MIDTRANS 
    const parameter = {
      transaction_details: {
        order_id,
        gross_amount: total,
      },
      customer_details: {
        first_name: 'User',
      },
      enabled_payments,
    };

    const transaction = await snap.createTransaction(parameter);

    // INSERT PEMBAYARAN 
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO pembayaran
        (
          pemesanan_id,
          total,
          status,
          order_id,
          snap_token,
          metode,
          transaction_status,
          payment_type,
          fraud_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          pemesanan_id,
          total,
          'pending',
          order_id,
          transaction.token,
          metode || 'midtrans',
          'pending',
          null,
          null,
        ],
        (err, result: ResultSetHeader) => {
          if (err) return reject(err);

          resolve(result.insertId);
        }
      );
    });

    return res.json({
      snap_token: transaction.token,
      order_id,
      total,
    });
  } catch (error: any) {

    return res.status(500).json({
      message: 'Midtrans error',
      error: error.message,
    });
  }
};

const normalizeStatus = (t: string) => {
  switch (t) {
    case 'settlement':
    case 'capture':
      return 'success';
    case 'pending':
      return 'pending';
    case 'expire':
      return 'expired';
    case 'cancel':
    case 'deny':
      return 'failed';
    default:
      return 'pending';
  }
};
const updatePemesananSetelahPembayaran = async (order_id: string, status: string) => {
  if (status !== 'success') return;

  await new Promise((resolve, reject) => {
    db.query(
      `UPDATE pemesanan pm
       INNER JOIN pembayaran pb ON pb.pemesanan_id = pm.id
       SET pm.status = 'diproses'
       WHERE pb.order_id = ?`,
      [order_id],
      (err) => {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
};

export const handleMidtransWebhook = async (req: Request, res: Response) => {
  try {
    const { order_id, transaction_status, payment_type, fraud_status } = req.body;

    const status = normalizeStatus(transaction_status);

    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE pembayaran 
        SET status = ?, 
            payment_type = ?, 
            transaction_status = ?, 
            fraud_status = ? 
        WHERE order_id = ?`,
        [status, payment_type || 'unknown', transaction_status, fraud_status, order_id],
        (err) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });
    await updatePemesananSetelahPembayaran(order_id, status);
    return res.status(200).json({
      message: 'Webhook processed',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Webhook error' });
  }
};

// GET ALL PEMBAYARAN
export const getAllPembayaran = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        p.id as pembayaran_id,
        p.pemesanan_id,
        p.total,
        p.status as payment_status,
        p.order_id,
        p.snap_token,
        p.metode,
        p.payment_type,
        p.transaction_status,
        p.fraud_status,
        p.created_at as payment_created_at,

        pm.jenis_bangunan,
        pm.luas_lahan,
        pm.jumlah_lantai,
        pm.jumlah_ruangan,
        pm.konsep_desain,
        pm.kebutuhan_khusus,
        pm.status as pesanan_status,
        pm.gambar

      FROM pembayaran p

      INNER JOIN (
          SELECT pemesanan_id, MAX(id) as latest_id
          FROM pembayaran
          GROUP BY pemesanan_id
      ) latest 
      ON p.pemesanan_id = latest.pemesanan_id 
      AND p.id = latest.latest_id

      LEFT JOIN pemesanan pm ON pm.id = p.pemesanan_id
      WHERE pm.id IS NOT NULL
      ORDER BY p.created_at DESC;
    `;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      return res.json(results);
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const checkAndUpdatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;

    if (!order_id || Array.isArray(order_id)) {
      return res.status(400).json({
        message: 'Order ID tidak valid',
      });
    }

    const statusResponse = await (coreApi as any).transaction.status(order_id);

    const transaction_status = statusResponse.transaction_status;
    const payment_type = statusResponse.payment_type;
    const fraud_status = statusResponse.fraud_status;

    const status = normalizeStatus(transaction_status);

    // update status pembayaran dari Midtrans
    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE pembayaran 
         SET status = ?, 
             payment_type = ?, 
             transaction_status = ?, 
             fraud_status = ?
         WHERE order_id = ?`,
        [status, payment_type || null, transaction_status, fraud_status || null, order_id],
        (err) => {
          if (err) return reject(err);
          resolve(true);
        }
      );
    });

    await updatePemesananSetelahPembayaran(order_id, status);

    if (status === 'success') {
      await new Promise((resolve, reject) => {
        db.query(
          `UPDATE pembayaran SET status = 'success' WHERE order_id = ?`,
          [order_id],
          (err) => {
            if (err) return reject(err);
            resolve(true);
          }
        );
      });

      db.query(
        `SELECT p.user_id, p.jenis_bangunan 
         FROM pemesanan p 
         INNER JOIN pembayaran pb ON pb.pemesanan_id = p.id 
         WHERE pb.order_id = ? LIMIT 1`,
        [order_id],
        (err, rows: any) => {
          if (!err && rows.length > 0) {
            insertNotifikasi(
              rows[0].user_id,
              'Pembayaran Berhasil',
              `Pembayaran untuk ${rows[0].jenis_bangunan} berhasil. Pesanan sedang diproses.`,
              'pembayaran'
            );

            db.query(
              `SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`,
              (err, arsitekRows: any) => {
                if (!err && arsitekRows.length > 0) {
                  insertNotifikasi(
                    arsitekRows[0].id,
                    'Pembayaran Klien Berhasil',
                    `Klien telah membayar pesanan ${rows[0].jenis_bangunan}. Siap dikerjakan.`,
                    'pembayaran'
                  );
                }
              }
            );
          }
        }
      );
    }

    return res.json({
      message: 'Status updated',
      status,
      transaction_status,
      payment_type,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
