"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndUpdatePaymentStatus = exports.getAllPembayaran = exports.handleMidtransWebhook = exports.createPayment = void 0;
const midtrans_1 = require("../config/midtrans");
const db_1 = require("../config/db");
const notifikasiController_1 = require("./notifikasiController");
// =====================
// CREATE PAYMENT
// =====================
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pemesanan_id, metode } = req.body;
        if (!pemesanan_id) {
            return res.status(400).json({
                message: "Pemesanan tidak ditemukan",
            });
        }
        // ================= AMBIL DATA PEMESANAN =================
        const pemesanan = yield new Promise((resolve, reject) => {
            db_1.db.query(`SELECT * FROM pemesanan WHERE id = ? LIMIT 1`, [pemesanan_id], (err, rows) => {
                if (err)
                    return reject(err);
                if (!rows.length) {
                    return reject(new Error("Pemesanan tidak ditemukan"));
                }
                resolve(rows[0]);
            });
        });
        // ================= HARGA FINAL =================
        const hargaFinal = Number(pemesanan.harga_final || 0);
        // biaya layanan
        const biayaLayanan = 100000;
        // total fix dari database
        const total = hargaFinal + biayaLayanan;
        if (total <= 0) {
            return res.status(400).json({
                message: "Total pembayaran tidak valid",
            });
        }
        const order_id = "ORDER-" + Date.now();
        // ================= PAYMENT METHOD =================
        let enabled_payments = [];
        if (metode === "transfer") {
            enabled_payments = ["bank_transfer"];
        }
        else if (metode === "ewallet") {
            enabled_payments = ["gopay"];
        }
        else if (metode === "virtual") {
            enabled_payments = ["bank_transfer"];
        }
        // ================= MIDTRANS =================
        const parameter = {
            transaction_details: {
                order_id,
                gross_amount: total,
            },
            customer_details: {
                first_name: "User",
            },
            enabled_payments,
        };
        const transaction = yield midtrans_1.snap.createTransaction(parameter);
        // ================= INSERT PEMBAYARAN =================
        yield new Promise((resolve, reject) => {
            db_1.db.query(`INSERT INTO pembayaran
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                pemesanan_id,
                total,
                "pending",
                order_id,
                transaction.token,
                metode || "midtrans",
                "pending",
                null,
                null,
            ], (err, result) => {
                if (err)
                    return reject(err);
                resolve(result.insertId);
            });
        });
        return res.json({
            snap_token: transaction.token,
            order_id,
            total,
        });
    }
    catch (error) {
        console.error("MIDTRANS ERROR:", error);
        return res.status(500).json({
            message: "Midtrans error",
            error: error.message,
        });
    }
});
exports.createPayment = createPayment;
const normalizeStatus = (t) => {
    switch (t) {
        case "settlement":
        case "capture":
            return "success";
        case "pending":
            return "pending";
        case "expire":
            return "expired";
        case "cancel":
        case "deny":
            return "failed";
        default:
            return "pending";
    }
};
const updatePemesananSetelahPembayaran = (order_id, status) => __awaiter(void 0, void 0, void 0, function* () {
    if (status !== "success")
        return;
    yield new Promise((resolve, reject) => {
        db_1.db.query(`UPDATE pemesanan pm
       INNER JOIN pembayaran pb ON pb.pemesanan_id = pm.id
       SET pm.status = 'diproses'
       WHERE pb.order_id = ?`, [order_id], (err) => {
            if (err)
                return reject(err);
            resolve(true);
        });
    });
});
const handleMidtransWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, transaction_status, payment_type, fraud_status, } = req.body;
        const status = normalizeStatus(transaction_status);
        yield new Promise((resolve, reject) => {
            db_1.db.query(`UPDATE pembayaran 
        SET status = ?, 
            payment_type = ?, 
            transaction_status = ?, 
            fraud_status = ? 
        WHERE order_id = ?`, [
                status,
                payment_type || "unknown",
                transaction_status,
                fraud_status,
                order_id,
            ], (err) => {
                if (err)
                    return reject(err);
                resolve(true);
            });
        });
        yield updatePemesananSetelahPembayaran(order_id, status);
        return res.status(200).json({
            message: "Webhook processed",
        });
    }
    catch (error) {
        console.error("WEBHOOK ERROR:", error);
        return res.status(500).json({ message: "Webhook error" });
    }
});
exports.handleMidtransWebhook = handleMidtransWebhook;
// =====================
// GET ALL PEMBAYARAN
// =====================
const getAllPembayaran = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        db_1.db.query(query, (err, results) => {
            if (err) {
                console.error("DB ERROR:", err);
                return res.status(500).json({ message: err.message });
            }
            return res.json(results);
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.getAllPembayaran = getAllPembayaran;
const checkAndUpdatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.params;
        if (!order_id || Array.isArray(order_id)) {
            return res.status(400).json({
                message: "Order ID tidak valid",
            });
        }
        const statusResponse = yield midtrans_1.coreApi.transaction.status(order_id);
        const transaction_status = statusResponse.transaction_status;
        const payment_type = statusResponse.payment_type;
        const fraud_status = statusResponse.fraud_status;
        const status = normalizeStatus(transaction_status);
        // update status pembayaran dari Midtrans
        yield new Promise((resolve, reject) => {
            db_1.db.query(`UPDATE pembayaran 
         SET status = ?, 
             payment_type = ?, 
             transaction_status = ?, 
             fraud_status = ?
         WHERE order_id = ?`, [
                status,
                payment_type || null,
                transaction_status,
                fraud_status || null,
                order_id,
            ], (err) => {
                if (err)
                    return reject(err);
                resolve(true);
            });
        });
        // update status pemesanan kalau pembayaran sukses
        yield updatePemesananSetelahPembayaran(order_id, status);
        // kalau sukses, pastikan status pembayaran tetap success
        if (status === "success") {
            yield new Promise((resolve, reject) => {
                db_1.db.query(`UPDATE pembayaran SET status = 'success' WHERE order_id = ?`, [order_id], (err) => {
                    if (err)
                        return reject(err);
                    resolve(true);
                });
            });
            db_1.db.query(`SELECT p.user_id, p.jenis_bangunan 
         FROM pemesanan p 
         INNER JOIN pembayaran pb ON pb.pemesanan_id = p.id 
         WHERE pb.order_id = ? LIMIT 1`, [order_id], (err, rows) => {
                if (!err && rows.length > 0) {
                    (0, notifikasiController_1.insertNotifikasi)(rows[0].user_id, "Pembayaran Berhasil", `Pembayaran untuk ${rows[0].jenis_bangunan} berhasil. Pesanan sedang diproses.`, "pembayaran");
                    db_1.db.query(`SELECT id FROM users WHERE role = 'arsitek' LIMIT 1`, (err, arsitekRows) => {
                        if (!err && arsitekRows.length > 0) {
                            (0, notifikasiController_1.insertNotifikasi)(arsitekRows[0].id, "Pembayaran Klien Berhasil", `Klien telah membayar pesanan ${rows[0].jenis_bangunan}. Siap dikerjakan.`, "pembayaran");
                        }
                    });
                }
            });
        }
        return res.json({
            message: "Status updated",
            status,
            transaction_status,
            payment_type,
        });
    }
    catch (error) {
        console.error("CHECK STATUS ERROR:", error);
        return res.status(500).json({ message: error.message });
    }
});
exports.checkAndUpdatePaymentStatus = checkAndUpdatePaymentStatus;
//# sourceMappingURL=pembayaranController.js.map