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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatbotMessage = exports.getChatMessages = exports.deleteChatSession = exports.createChatSession = exports.getChatSessions = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const db_1 = require("../config/db");
const crypto_1 = __importDefault(require("crypto"));
// ================= Groq config =================
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
// ================= Konfigurasi pembayaran =================
const BIAYA_PEMBAYARAN = 100000;
// ================= Helper Query Async =================
const queryAsync = (sql, values = []) => {
    return new Promise((resolve, reject) => {
        db_1.db.query(sql, values, (err, result) => {
            if (err)
                reject(err);
            else
                resolve(result);
        });
    });
};
// ================= Helper SSE =================
const sendSSE = (res, data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};
// Memastikan akun klien
const pastikanKlien = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        res.status(401).json({
            message: "User belum login",
        });
        return null;
    }
    const rows = yield queryAsync(`
    SELECT id, role
    FROM users
    WHERE id = ?
    `, [userId]);
    const user = rows[0];
    if (!user) {
        res.status(404).json({
            message: "User tidak ditemukan",
        });
        return null;
    }
    if (user.role !== "klien") {
        res.status(403).json({
            message: "Chatbot hanya tersedia untuk klien",
        });
        return null;
    }
    return {
        userId,
        role: String(user.role),
    };
});
// ================= AMBIL CONTEXT DATABASE KHUSUS KLIEN =================
// Data tetap diambil dari fitur yang sesuai, tapi dibuat ringkas agar tidak mudah kena limit token.
const ambilContextChatbot = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const profileRows = yield queryAsync(`
    SELECT nama, email
    FROM users
    WHERE id = ? AND role = 'klien'
    `, [userId]);
    const layanan = yield queryAsync(`
    SELECT 
      nama_layanan,
      harga,
      jenis_bangunan,
      konsep_desain
    FROM layanan
    ORDER BY id DESC
    LIMIT 8
    `);
    const pemesanan = yield queryAsync(`
    SELECT 
      id,
      jenis_bangunan,
      luas_lahan,
      jumlah_lantai,
      jumlah_ruangan,
      harga_final,
      status,
      DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal
    FROM pemesanan
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 5 
    `, // Data yang dikirim ke AI dibatasi agar prompt tidak terlalu besar
    [userId]);
    const pembayaran = yield queryAsync(`
    SELECT 
      pb.id,
      pb.pemesanan_id,
      pb.metode,
      pb.status AS status_bayar,
      p.jenis_bangunan,
      p.harga_final AS harga,
      p.status AS status_pesan,
      COALESCE(pb.total, p.harga_final + ${BIAYA_PEMBAYARAN}) AS total,
      DATE_FORMAT(pb.created_at, '%Y-%m-%d') AS tanggal
    FROM pembayaran pb
    INNER JOIN pemesanan p ON p.id = pb.pemesanan_id
    WHERE p.user_id = ?
    ORDER BY pb.id DESC
    LIMIT 5
    `, [userId]);
    const jadwal = yield queryAsync(`
    SELECT 
      j.id,
      j.pemesanan_id,
      j.status,
      DATE_FORMAT(j.tanggal_mulai, '%Y-%m-%d') AS mulai,
      DATE_FORMAT(j.tanggal_selesai, '%Y-%m-%d') AS selesai,
      p.jenis_bangunan
    FROM jadwal j
    INNER JOIN pemesanan p ON p.id = j.pemesanan_id
    WHERE p.user_id = ?
    ORDER BY j.id DESC
    LIMIT 5
    `, [userId]);
    const hasilDesain = yield queryAsync(`
    SELECT 
      h.id,
      h.pemesanan_id,
      h.status,
      LEFT(h.keterangan, 80) AS keterangan,
      IF(h.denah_url IS NOT NULL, 'ada', '-') AS denah,
      IF(h.gambar_url IS NOT NULL, 'ada', '-') AS gambar,
      IF(h.file3d_url IS NOT NULL, 'ada', '-') AS file3d,
      p.jenis_bangunan
    FROM hasil_desain h
    INNER JOIN pemesanan p ON p.id = h.pemesanan_id
    WHERE p.user_id = ?
    ORDER BY h.id DESC
    LIMIT 5
    `, [userId]);
    const revisi = yield queryAsync(`
    SELECT 
      r.id,
      r.pemesanan_id,
      r.jenis_revisi,
      r.status,
      r.revisi_ke,
      LEFT(r.catatan, 80) AS catatan,
      p.jenis_bangunan
    FROM revisi r
    INNER JOIN pemesanan p ON p.id = r.pemesanan_id
    WHERE p.user_id = ?
    ORDER BY r.id DESC
    LIMIT 5
    `, [userId]);
    const notifikasi = yield queryAsync(`
    SELECT 
      judul,
      LEFT(pesan, 80) AS pesan,
      type,
      is_read,
      DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal
    FROM notifikasi
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
    `, [userId]);
    const profile = profileRows[0];
    return {
        profil: profile
            ? {
                nama: profile.nama,
                email: profile.email,
            }
            : null,
        layanan,
        rekomendasi: layanan,
        pemesanan,
        pembayaran: pembayaran.map((item) => (Object.assign(Object.assign({}, item), { biaya_admin: BIAYA_PEMBAYARAN, harga: Number(item.harga || 0), total: Number(item.total || 0) }))),
        jadwal,
        hasil_desain: hasilDesain,
        revisi,
        notifikasi,
    };
});
// ================= FORMAT CONTEXT KE TEKS RINGKAS =================
const formatContextKeTeks = (ctx) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const baris = [];
    if (ctx.profil) {
        baris.push(`PROFIL: ${ctx.profil.nama} (${ctx.profil.email})`);
    }
    if (((_a = ctx.pemesanan) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        baris.push("PEMESANAN:");
        ctx.pemesanan.forEach((p) => {
            baris.push(`- id${p.id} ${p.jenis_bangunan} luas ${p.luas_lahan}m², ` +
                `${p.jumlah_lantai} lantai, ${p.jumlah_ruangan} ruangan, ` +
                `harga Rp${Number(p.harga_final || 0).toLocaleString("id-ID")}, ` +
                `status ${p.status}, tanggal ${p.tanggal}`);
        });
    }
    else {
        baris.push("PEMESANAN: kosong");
    }
    if (((_b = ctx.pembayaran) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        baris.push("PEMBAYARAN:");
        ctx.pembayaran.forEach((p) => {
            baris.push(`- id${p.id} pemesanan id${p.pemesanan_id}, ${p.jenis_bangunan}, ` +
                `harga Rp${Number(p.harga || 0).toLocaleString("id-ID")}, ` +
                `biaya admin Rp${BIAYA_PEMBAYARAN.toLocaleString("id-ID")}, ` +
                `total Rp${Number(p.total || 0).toLocaleString("id-ID")}, ` +
                `metode ${p.metode || "-"}, status bayar ${p.status_bayar || "-"}, ` +
                `status pesanan ${p.status_pesan || "-"}, tanggal ${p.tanggal}`);
        });
    }
    else {
        baris.push("PEMBAYARAN: kosong");
    }
    if (((_c = ctx.jadwal) === null || _c === void 0 ? void 0 : _c.length) > 0) {
        baris.push("JADWAL:");
        ctx.jadwal.forEach((j) => {
            baris.push(`- id${j.id} pemesanan id${j.pemesanan_id}, ${j.jenis_bangunan}, ` +
                `mulai ${j.mulai || "-"}, selesai ${j.selesai || "-"}, status ${j.status}`);
        });
    }
    else {
        baris.push("JADWAL: kosong");
    }
    if (((_d = ctx.hasil_desain) === null || _d === void 0 ? void 0 : _d.length) > 0) {
        baris.push("HASIL_DESAIN:");
        ctx.hasil_desain.forEach((h) => {
            baris.push(`- id${h.id} pemesanan id${h.pemesanan_id}, ${h.jenis_bangunan}, ` +
                `status ${h.status}, denah ${h.denah}, gambar ${h.gambar}, 3D ${h.file3d}, ` +
                `keterangan ${h.keterangan || "-"}`);
        });
    }
    else {
        baris.push("HASIL_DESAIN: kosong");
    }
    if (((_e = ctx.revisi) === null || _e === void 0 ? void 0 : _e.length) > 0) {
        baris.push("REVISI:");
        ctx.revisi.forEach((r) => {
            baris.push(`- id${r.id} pemesanan id${r.pemesanan_id}, ${r.jenis_bangunan}, ` +
                `revisi ke-${r.revisi_ke}, jenis ${r.jenis_revisi}, status ${r.status}, ` +
                `catatan ${r.catatan || "-"}`);
        });
    }
    else {
        baris.push("REVISI: kosong");
    }
    if (((_f = ctx.notifikasi) === null || _f === void 0 ? void 0 : _f.length) > 0) {
        baris.push("NOTIFIKASI:");
        ctx.notifikasi.forEach((n) => {
            baris.push(`- ${n.judul}: ${n.pesan} (${n.is_read ? "dibaca" : "belum dibaca"})`);
        });
    }
    else {
        baris.push("NOTIFIKASI: kosong");
    }
    if (((_g = ctx.rekomendasi) === null || _g === void 0 ? void 0 : _g.length) > 0) {
        baris.push("REKOMENDASI:");
        ctx.rekomendasi.forEach((r) => {
            baris.push(`- ${r.nama_layanan}, harga Rp${Number(r.harga || 0).toLocaleString("id-ID")}, ` +
                `jenis ${r.jenis_bangunan || "-"}, konsep ${r.konsep_desain || "-"}`);
        });
    }
    else {
        baris.push("REKOMENDASI: kosong");
    }
    if (((_h = ctx.layanan) === null || _h === void 0 ? void 0 : _h.length) > 0) {
        baris.push("LAYANAN:");
        ctx.layanan.forEach((l) => {
            baris.push(`- ${l.nama_layanan}, harga Rp${Number(l.harga || 0).toLocaleString("id-ID")}, jenis ${l.jenis_bangunan || "-"}, konsep ${l.konsep_desain || "-"}`);
        });
    }
    else {
        baris.push("LAYANAN: kosong");
    }
    return baris.join("\n");
};
// ================= PROMPT CHATBOT =================
const buatPromptChatbot = (context, message) => {
    const ctxTeks = formatContextKeTeks(context);
    return `
Kamu adalah chatbot resmi Sae Pisan untuk klien.

Aturan:
- Jawab hanya berdasarkan DATA SISTEM.
- Jangan mengarang data.
- Jangan membuat status, harga, jadwal, revisi, atau hasil desain sendiri.
- Jika data yang ditanya kosong, jawab bahwa data tersebut belum tersedia di sistem.
- Jika bertanya pembayaran, gunakan data PEMBAYARAN.
- Total pembayaran sudah termasuk biaya admin Rp100.000.
- Jika bertanya pesanan, gunakan data PEMESANAN.
- Jika bertanya jadwal, gunakan data JADWAL.
- Jika bertanya hasil desain, denah, gambar kerja, atau 3D, gunakan data HASIL_DESAIN.
- Jika bertanya revisi, gunakan data REVISI.
- Jika bertanya notifikasi, gunakan data NOTIFIKASI.
- Jika bertanya layanan atau harga jasa, gunakan data LAYANAN.
- Jawab singkat, jelas, sopan, dan langsung ke inti.
- Jangan tampilkan JSON mentah.
- Jika bertanya rekomendasi, gunakan data REKOMENDASI yang berasal dari LAYANAN.

DATA SISTEM:
${ctxTeks}

PERTANYAAN KLIEN:
${message}

JAWABAN:
`;
};
// ================= GET ALL SESSIONS =================
const getChatSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cek = yield pastikanKlien(req, res);
        if (!cek)
            return;
        const { userId } = cek;
        const sessions = yield queryAsync(`
      SELECT id, user_id, session_token, title, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      `, [userId]);
        return res.json(sessions);
    }
    catch (err) {
        console.error("GET CHAT SESSIONS ERROR:", err);
        return res.status(500).json({
            message: "Gagal ambil session chatbot",
            error: err.message,
        });
    }
});
exports.getChatSessions = getChatSessions;
// ================= CREATE SESSION =================
const createChatSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cek = yield pastikanKlien(req, res);
        if (!cek)
            return;
        const { userId } = cek;
        const { title } = req.body;
        const sessionToken = crypto_1.default.randomBytes(32).toString("hex");
        const defaultTitle = title || "Chat Baru";
        const result = yield queryAsync(`
      INSERT INTO chat_sessions (user_id, session_token, title)
      VALUES (?, ?, ?)
      `, [userId, sessionToken, defaultTitle]);
        const session = yield queryAsync(`
      SELECT id, user_id, session_token, title, created_at, updated_at
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `, [result.insertId, userId]);
        return res.status(201).json(session[0]);
    }
    catch (err) {
        console.error("CREATE CHAT SESSION ERROR:", err);
        return res.status(500).json({
            message: "Gagal membuat session chatbot",
            error: err.message,
        });
    }
});
exports.createChatSession = createChatSession;
// ================= DELETE SESSION =================
const deleteChatSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cek = yield pastikanKlien(req, res);
        if (!cek)
            return;
        const { userId } = cek;
        const { sessionId } = req.params;
        const session = yield queryAsync(`
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        if (session.length === 0) {
            return res.status(404).json({
                message: "Session tidak ditemukan",
            });
        }
        yield queryAsync(`
      DELETE FROM chat_messages
      WHERE session_id = ?
      `, [sessionId]);
        yield queryAsync(`
      DELETE FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        return res.json({
            message: "Session chatbot berhasil dihapus",
        });
    }
    catch (err) {
        console.error("DELETE CHAT SESSION ERROR:", err);
        return res.status(500).json({
            message: "Gagal hapus session chatbot",
            error: err.message,
        });
    }
});
exports.deleteChatSession = deleteChatSession;
// ================= GET MESSAGES BY SESSION =================
const getChatMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cek = yield pastikanKlien(req, res);
        if (!cek)
            return;
        const { userId } = cek;
        const { sessionId } = req.params;
        const session = yield queryAsync(`
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        if (session.length === 0) {
            return res.status(404).json({
                message: "Session tidak ditemukan",
            });
        }
        const messages = yield queryAsync(`
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
      `, [sessionId]);
        return res.json(messages);
    }
    catch (err) {
        console.error("GET CHAT MESSAGES ERROR:", err);
        return res.status(500).json({
            message: "Gagal ambil pesan chatbot",
            error: err.message,
        });
    }
});
exports.getChatMessages = getChatMessages;
// ================= SEND MESSAGE STREAMING GROQ =================
const sendChatbotMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d, _e, _f, _g, _h;
    try {
        const cek = yield pastikanKlien(req, res);
        if (!cek)
            return;
        const { userId } = cek;
        const { sessionId, message } = req.body;
        if (!sessionId || !message) {
            return res.status(400).json({
                message: "sessionId dan message wajib diisi",
            });
        }
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                message: "GROQ_API_KEY belum diatur di .env",
            });
        }
        const session = yield queryAsync(`
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        if (session.length === 0) {
            return res.status(404).json({
                message: "Session tidak ditemukan",
            });
        }
        yield queryAsync(`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
      `, [sessionId, "user", message]);
        yield queryAsync(`
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        const context = yield ambilContextChatbot(userId);
        if (!context.profil) {
            return res.status(403).json({
                message: "Profil klien tidak ditemukan",
            });
        }
        const systemPrompt = buatPromptChatbot(context, message);
        const history = yield queryAsync(`
      SELECT role, content
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 2
      `, [sessionId]);
        const chatHistory = history
            .reverse()
            .filter((item) => item.role === "user" || item.role === "assistant")
            .map((item) => ({
            role: item.role,
            content: String(item.content || "").substring(0, 300),
        }));
        const messages = [
            {
                role: "system",
                content: systemPrompt,
            },
            ...chatHistory,
        ];
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        const completion = yield groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
            messages,
            temperature: 0.2,
            stream: true,
            max_tokens: 500,
        });
        let fullAnswer = "";
        try {
            for (var _j = true, completion_1 = __asyncValues(completion), completion_1_1; completion_1_1 = yield completion_1.next(), _a = completion_1_1.done, !_a; _j = true) {
                _c = completion_1_1.value;
                _j = false;
                const chunk = _c;
                const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || "";
                if (content) {
                    fullAnswer += content;
                    sendSSE(res, {
                        type: "text",
                        content,
                    });
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_j && !_a && (_b = completion_1.return)) yield _b.call(completion_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        yield queryAsync(`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
      `, [sessionId, "assistant", fullAnswer]);
        yield queryAsync(`
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `, [sessionId, userId]);
        sendSSE(res, {
            type: "done",
        });
        res.end();
    }
    catch (err) {
        console.error("SEND CHATBOT MESSAGE ERROR:", err);
        if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
        }
        const isRateLimit = (err === null || err === void 0 ? void 0 : err.status) === 429 ||
            ((_f = err === null || err === void 0 ? void 0 : err.message) === null || _f === void 0 ? void 0 : _f.includes("rate_limit_exceeded")) ||
            ((_g = err === null || err === void 0 ? void 0 : err.message) === null || _g === void 0 ? void 0 : _g.includes("Rate limit")) ||
            ((_h = err === null || err === void 0 ? void 0 : err.message) === null || _h === void 0 ? void 0 : _h.includes("tokens per minute"));
        sendSSE(res, {
            type: "error",
            message: isRateLimit
                ? "Chatbot sedang terlalu banyak digunakan atau data yang dikirim terlalu besar. Tunggu sekitar 1 menit lalu coba lagi."
                : err.message || "Terjadi kesalahan pada chatbot",
        });
        res.end();
    }
});
exports.sendChatbotMessage = sendChatbotMessage;
//# sourceMappingURL=chatbotController.js.map