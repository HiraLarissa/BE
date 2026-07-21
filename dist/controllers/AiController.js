"use strict";
// // src/controllers/aiController.ts
// // Kirim pesan ke Groq + stream respons via SSE ke frontend
// import { Response } from 'express';
// import { AuthRequest } from '../middleware/authMiddleware';
// // import { v4 as uuidv4 } from 'uuid';
// import  groq from '../config/groq';
// import { db } from '../config/db';
// import { RowDataPacket, ResultSetHeader } from 'mysql2';
Object.defineProperty(exports, "__esModule", { value: true });
// interface SessionRow extends RowDataPacket {
//   id: string;
//   user_id: string;
// }
// interface MessageRow extends RowDataPacket {
//   role: 'user' | 'assistant';
//   content: string;
// }
// // ─── System Prompt ───────────────────────────────────────────
// // Sesuaikan dengan layanan kamu
// const SYSTEM_PROMPT = `Kamu adalah asisten AI profesional untuk layanan desain rumah dan arsitektur bernama "ArsiBot".
// Tugasmu:
// 1. Membantu klien memahami layanan desain rumah yang tersedia
// 2. Menjawab pertanyaan seputar proses desain, material, estimasi biaya
// 3. Menjelaskan tahapan proyek dari konsultasi hingga serah terima
// 4. Memberikan rekomendasi berdasarkan kebutuhan dan budget klien
// 5. Mengarahkan klien untuk booking konsultasi jika sudah serius
// Gaya komunikasi:
// - Gunakan bahasa Indonesia yang ramah dan profesional
// - Berikan jawaban konkret dan bermanfaat
// - Jika ada pertanyaan teknis kompleks, sarankan konsultasi langsung dengan arsitek
// - Selalu semangat membantu dan positif
// Batasan:
// - Jangan beri estimasi harga sangat spesifik tanpa tahu detail proyek
// - Arahkan ke tim arsitek untuk keputusan desain final`;
// // ─── Kirim pesan + stream respons ────────────────────────────
// export async function sendMessage(
//     req: AuthRequest,
//     res: Response
//     ): Promise<void> {
//   const userId = req.user!.id;
//   const { sessionId, message } = req.body as {
//     sessionId?: string;
//     message?: string;
//   };
//   if (!sessionId || !message?.trim()) {
//     res.status(400).json({ success: false, message: 'sessionId dan message wajib diisi' });
//     return;
//   }
//   try {
//     // Verifikasi sesi milik user
//     const [sessions] = await db.promise().query<SessionRow[]>(
//       'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
//       [sessionId, userId]
//     );
//     if (sessions.length === 0) {
//       res.status(404).json({ success: false, message: 'Sesi tidak ditemukan' });
//       return;
//     }
//     // Simpan pesan user
//     // const userMsgId = uuidv4();
//     await db.promise().query<ResultSetHeader>(
//     'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
//     [sessionId, 'user', message.trim()]
//     );
//     // Auto-update judul sesi jika masih default
//     await db.promise().query(
//       `UPDATE chat_sessions
//        SET title = IF(title = 'Percakapan Baru', SUBSTRING(?, 1, 60), title),
//            updated_at = NOW()
//        WHERE id = ?`,
//       [message.trim(), sessionId]
//     );
//     // Ambil histori pesan (max 20 terakhir untuk konteks)
//     const [history] = await db.promise().query<MessageRow[]>(
//       `SELECT role, content FROM messages
//        WHERE session_id = ?
//        ORDER BY created_at DESC
//        LIMIT 20`,
//       [sessionId]
//     );
//     const orderedHistory = history.reverse();
//     // ─── Setup SSE ─────────────────────────────────────────
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.setHeader('X-Accel-Buffering', 'no');
//     res.flushHeaders();
//     let fullResponse = '';
//     let totalTokens = 0;
//     // ─── Stream dari Groq ───────────────────────────────────
//     const stream = await groq.chat.completions.create({
//       model: 'llama-3.1-70b-versatile',  // Model terbaik Groq, gratis
//       max_tokens: 1500,
//       temperature: 0.7,
//       stream: true,
//       messages: [
//         { role: 'system', content: SYSTEM_PROMPT },
//         ...orderedHistory.map((m: MessageRow) => ({
//           role: m.role as 'user' | 'assistant',
//           content: m.content,
//         })),
//       ],
//     });
//     for await (const chunk of stream) {
//       const text = chunk.choices[0]?.delta?.content || '';
//       if (text) {
//         fullResponse += text;
//         // Kirim chunk ke frontend via SSE
//         res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
//       }
//     //   // Ambil token usage dari chunk terakhir
//     //   if (chunk.usage) {
//     //     totalTokens = chunk.usage.completion_tokens ?? 0;
//     //   }
//     }
//     // Simpan respons asisten ke database
//     // const aiMsgId = uuidv4();
//     await db.promise().query(
//     'INSERT INTO messages (session_id, role, content, tokens_used) VALUES (?, ?, ?, ?)',
//     [sessionId, 'assistant', fullResponse, totalTokens || 0]
//     );
//     // Kirim event selesai
//     res.write(`data: ${JSON.stringify({ type: 'done', userMsgId })}\n\n`);
//   } catch (err: unknown) {
//     console.error('AI stream error:', err);
//     const msg = err instanceof Error ? err.message : 'Terjadi kesalahan pada AI';
//     res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`);
//   } finally {
//     res.end();
//   }
// }
//# sourceMappingURL=AiController.js.map