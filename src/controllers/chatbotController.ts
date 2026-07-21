import { Response } from 'express';
import Groq from 'groq-sdk';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import crypto from 'crypto';

// ================= Groq config =================
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ================= Konfigurasi pembayaran =================
const BIAYA_PEMBAYARAN = 100000;

// ================= Helper Query Async =================
const queryAsync = <T = any>(sql: string, values: any[] = []): Promise<T> => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ================= Helper SSE =================
const sendSSE = (
  res: Response,
  data: {
    type: 'text' | 'done' | 'error';
    content?: string;
    message?: string;
  }
) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Memastikan akun klien
const pastikanKlien = async (
  req: AuthRequest,
  res: Response
): Promise<{ userId: number; role: string } | null> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      message: 'User belum login',
    });
    return null;
  }

  const rows = await queryAsync<RowDataPacket[]>(
    `
    SELECT id, role
    FROM users
    WHERE id = ?
    `,
    [userId]
  );

  const user = rows[0];

  if (!user) {
    res.status(404).json({
      message: 'User tidak ditemukan',
    });
    return null;
  }

  if (user.role !== 'klien') {
    res.status(403).json({
      message: 'Chatbot hanya tersedia untuk klien',
    });
    return null;
  }

  return {
    userId,
    role: String(user.role),
  };
};

// ================= AMBIL CONTEXT DATABASE KHUSUS KLIEN =================
// Data tetap diambil dari fitur yang sesuai, tapi dibuat ringkas agar tidak mudah kena limit token.
const ambilContextChatbot = async (userId: number) => {
  const profileRows = await queryAsync<RowDataPacket[]>(
    `
    SELECT nama, email
    FROM users
    WHERE id = ? AND role = 'klien'
    `,
    [userId]
  );

  const layanan = await queryAsync<RowDataPacket[]>(
    `
    SELECT 
      nama_layanan,
      harga,
      jenis_bangunan,
      konsep_desain
    FROM layanan
    ORDER BY id DESC
    LIMIT 8
    `
  );

  const pemesanan = await queryAsync<RowDataPacket[]>(
    `
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
    [userId]
  );

  const pembayaran = await queryAsync<RowDataPacket[]>(
    `
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
    `,
    [userId]
  );

  const jadwal = await queryAsync<RowDataPacket[]>(
    `
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
    `,
    [userId]
  );

  const hasilDesain = await queryAsync<RowDataPacket[]>(
    `
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
    `,
    [userId]
  );

  const revisi = await queryAsync<RowDataPacket[]>(
    `
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
    `,
    [userId]
  );

  const notifikasi = await queryAsync<RowDataPacket[]>(
    `
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
    `,
    [userId]
  );

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
    pembayaran: pembayaran.map((item) => ({
      ...item,
      biaya_admin: BIAYA_PEMBAYARAN,
      harga: Number(item.harga || 0),
      total: Number(item.total || 0),
    })),
    jadwal,
    hasil_desain: hasilDesain,
    revisi,
    notifikasi,
  };
};

// ================= FORMAT CONTEXT KE TEKS RINGKAS =================
const formatContextKeTeks = (ctx: any): string => {
  const baris: string[] = [];

  if (ctx.profil) {
    baris.push(`PROFIL: ${ctx.profil.nama} (${ctx.profil.email})`);
  }

  if (ctx.pemesanan?.length > 0) {
    baris.push('PEMESANAN:');
    ctx.pemesanan.forEach((p: any) => {
      baris.push(
        `- id${p.id} ${p.jenis_bangunan} luas ${p.luas_lahan}m², ` +
          `${p.jumlah_lantai} lantai, ${p.jumlah_ruangan} ruangan, ` +
          `harga Rp${Number(p.harga_final || 0).toLocaleString('id-ID')}, ` +
          `status ${p.status}, tanggal ${p.tanggal}`
      );
    });
  } else {
    baris.push('PEMESANAN: kosong');
  }

  if (ctx.pembayaran?.length > 0) {
    baris.push('PEMBAYARAN:');
    ctx.pembayaran.forEach((p: any) => {
      baris.push(
        `- id${p.id} pemesanan id${p.pemesanan_id}, ${p.jenis_bangunan}, ` +
          `harga Rp${Number(p.harga || 0).toLocaleString('id-ID')}, ` +
          `biaya admin Rp${BIAYA_PEMBAYARAN.toLocaleString('id-ID')}, ` +
          `total Rp${Number(p.total || 0).toLocaleString('id-ID')}, ` +
          `metode ${p.metode || '-'}, status bayar ${p.status_bayar || '-'}, ` +
          `status pesanan ${p.status_pesan || '-'}, tanggal ${p.tanggal}`
      );
    });
  } else {
    baris.push('PEMBAYARAN: kosong');
  }

  if (ctx.jadwal?.length > 0) {
    baris.push('JADWAL:');
    ctx.jadwal.forEach((j: any) => {
      baris.push(
        `- id${j.id} pemesanan id${j.pemesanan_id}, ${j.jenis_bangunan}, ` +
          `mulai ${j.mulai || '-'}, selesai ${j.selesai || '-'}, status ${j.status}`
      );
    });
  } else {
    baris.push('JADWAL: kosong');
  }

  if (ctx.hasil_desain?.length > 0) {
    baris.push('HASIL_DESAIN:');
    ctx.hasil_desain.forEach((h: any) => {
      baris.push(
        `- id${h.id} pemesanan id${h.pemesanan_id}, ${h.jenis_bangunan}, ` +
          `status ${h.status}, denah ${h.denah}, gambar ${h.gambar}, 3D ${h.file3d}, ` +
          `keterangan ${h.keterangan || '-'}`
      );
    });
  } else {
    baris.push('HASIL_DESAIN: kosong');
  }

  if (ctx.revisi?.length > 0) {
    baris.push('REVISI:');
    ctx.revisi.forEach((r: any) => {
      baris.push(
        `- id${r.id} pemesanan id${r.pemesanan_id}, ${r.jenis_bangunan}, ` +
          `revisi ke-${r.revisi_ke}, jenis ${r.jenis_revisi}, status ${r.status}, ` +
          `catatan ${r.catatan || '-'}`
      );
    });
  } else {
    baris.push('REVISI: kosong');
  }

  if (ctx.notifikasi?.length > 0) {
    baris.push('NOTIFIKASI:');
    ctx.notifikasi.forEach((n: any) => {
      baris.push(`- ${n.judul}: ${n.pesan} (${n.is_read ? 'dibaca' : 'belum dibaca'})`);
    });
  } else {
    baris.push('NOTIFIKASI: kosong');
  }

  if (ctx.rekomendasi?.length > 0) {
    baris.push('REKOMENDASI:');
    ctx.rekomendasi.forEach((r: any) => {
      baris.push(
        `- ${r.nama_layanan}, harga Rp${Number(r.harga || 0).toLocaleString('id-ID')}, ` +
          `jenis ${r.jenis_bangunan || '-'}, konsep ${r.konsep_desain || '-'}`
      );
    });
  } else {
    baris.push('REKOMENDASI: kosong');
  }

  if (ctx.layanan?.length > 0) {
    baris.push('LAYANAN:');
    ctx.layanan.forEach((l: any) => {
      baris.push(
        `- ${l.nama_layanan}, harga Rp${Number(l.harga || 0).toLocaleString(
          'id-ID'
        )}, jenis ${l.jenis_bangunan || '-'}, konsep ${l.konsep_desain || '-'}`
      );
    });
  } else {
    baris.push('LAYANAN: kosong');
  }

  return baris.join('\n');
};

// ================= PROMPT CHATBOT =================
const buatPromptChatbot = (context: any, message: string) => {
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
export const getChatSessions = async (req: AuthRequest, res: Response) => {
  try {
    const cek = await pastikanKlien(req, res);
    if (!cek) return;

    const { userId } = cek;

    const sessions = await queryAsync<RowDataPacket[]>(
      `
      SELECT id, user_id, session_token, title, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = ?
      ORDER BY updated_at DESC
      `,
      [userId]
    );

    return res.json(sessions);
  } catch (err: any) {

    return res.status(500).json({
      message: 'Gagal ambil session chatbot',
      error: err.message,
    });
  }
};

// ================= CREATE SESSION =================
export const createChatSession = async (req: AuthRequest, res: Response) => {
  try {
    const cek = await pastikanKlien(req, res);
    if (!cek) return;

    const { userId } = cek;
    const { title } = req.body;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const defaultTitle = title || 'Chat Baru';

    const result = await queryAsync<ResultSetHeader>(
      `
      INSERT INTO chat_sessions (user_id, session_token, title)
      VALUES (?, ?, ?)
      `,
      [userId, sessionToken, defaultTitle]
    );

    const session = await queryAsync<RowDataPacket[]>(
      `
      SELECT id, user_id, session_token, title, created_at, updated_at
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `,
      [result.insertId, userId]
    );

    return res.status(201).json(session[0]);
  } catch (err: any) {

    return res.status(500).json({
      message: 'Gagal membuat session chatbot',
      error: err.message,
    });
  }
};

// ================= DELETE SESSION =================
export const deleteChatSession = async (req: AuthRequest, res: Response) => {
  try {
    const cek = await pastikanKlien(req, res);
    if (!cek) return;

    const { userId } = cek;
    const { sessionId } = req.params;

    const session = await queryAsync<RowDataPacket[]>(
      `
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session tidak ditemukan',
      });
    }

    await queryAsync<ResultSetHeader>(
      `
      DELETE FROM chat_messages
      WHERE session_id = ?
      `,
      [sessionId]
    );

    await queryAsync<ResultSetHeader>(
      `
      DELETE FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    return res.json({
      message: 'Session chatbot berhasil dihapus',
    });
  } catch (err: any) {

    return res.status(500).json({
      message: 'Gagal hapus session chatbot',
      error: err.message,
    });
  }
};

// ================= GET MESSAGES BY SESSION =================
export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const cek = await pastikanKlien(req, res);
    if (!cek) return;

    const { userId } = cek;
    const { sessionId } = req.params;

    const session = await queryAsync<RowDataPacket[]>(
      `
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session tidak ditemukan',
      });
    }

    const messages = await queryAsync<RowDataPacket[]>(
      `
      SELECT id, role, content, created_at
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at ASC
      `,
      [sessionId]
    );

    return res.json(messages);
  } catch (err: any) {

    return res.status(500).json({
      message: 'Gagal ambil pesan chatbot',
      error: err.message,
    });
  }
};

// ================= SEND MESSAGE STREAMING GROQ =================
export const sendChatbotMessage = async (req: AuthRequest, res: Response) => {
  try {
    const cek = await pastikanKlien(req, res);
    if (!cek) return;

    const { userId } = cek;
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        message: 'sessionId dan message wajib diisi',
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        message: 'GROQ_API_KEY belum diatur di .env',
      });
    }

    const session = await queryAsync<RowDataPacket[]>(
      `
      SELECT id
      FROM chat_sessions
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    if (session.length === 0) {
      return res.status(404).json({
        message: 'Session tidak ditemukan',
      });
    }

    await queryAsync<ResultSetHeader>(
      `
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
      `,
      [sessionId, 'user', message]
    );

    await queryAsync<ResultSetHeader>(
      `
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    const context = await ambilContextChatbot(userId);

    if (!context.profil) {
      return res.status(403).json({
        message: 'Profil klien tidak ditemukan',
      });
    }

    const systemPrompt = buatPromptChatbot(context, message);

    const history = await queryAsync<RowDataPacket[]>(
      `
      SELECT role, content
      FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 2
      `,
      [sessionId]
    );

    const chatHistory: ChatCompletionMessageParam[] = history
      .reverse()
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .map((item) => ({
        role: item.role as 'user' | 'assistant',
        content: String(item.content || '').substring(0, 300),
      }));

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...chatHistory,
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      temperature: 0.2,
      stream: true,
      max_tokens: 500,
    });

    let fullAnswer = '';

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        fullAnswer += content;

        sendSSE(res, {
          type: 'text',
          content,
        });
      }
    }

    await queryAsync<ResultSetHeader>(
      `
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
      `,
      [sessionId, 'assistant', fullAnswer]
    );

    await queryAsync<ResultSetHeader>(
      `
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = ? AND user_id = ?
      `,
      [sessionId, userId]
    );

    sendSSE(res, {
      type: 'done',
    });

    res.end();
  } catch (err: any) {

    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    const isRateLimit =
      err?.status === 429 ||
      err?.message?.includes('rate_limit_exceeded') ||
      err?.message?.includes('Rate limit') ||
      err?.message?.includes('tokens per minute');

    sendSSE(res, {
      type: 'error',
      message: isRateLimit
        ? 'Chatbot sedang terlalu banyak digunakan atau data yang dikirim terlalu besar. Tunggu sekitar 1 menit lalu coba lagi.'
        : err.message || 'Terjadi kesalahan pada chatbot',
    });

    res.end();
  }
};
