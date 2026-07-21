import path from 'path';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import userRoutes from './routes/userRoutes';
import layananRoutes from './routes/layananRoutes';
import pemesananRoutes from './routes/pemesananRoutes';
import pembayaranRoutes from './routes/pembayaranRoutes';
import jadwalRoutes from './routes/jadwalRoutes';
import hasilDesainRoutes from './routes/hasilDesainRoutes';
import revisiRoutes from './routes/revisiRoutes';
import notifikasiRoutes from './routes/notifikasiRoutes';
import chatbotRoutes from './routes/chatRoutes';
import { startDeadlineNotifCron } from './controllers/jadwalController';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Jalan 🚀');
});

app.use('/api/users', userRoutes);
app.use('/api/layanan', layananRoutes);
app.use('/api/pemesanan', pemesananRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/hasil-desain', hasilDesainRoutes);
app.use('/api/revisi', revisiRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/chatbot', chatbotRoutes);

// // uploadddd
// app.use("/uploads", express.static("uploads"));
// app.use("/uploads", express.static("public/uploads"));
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// // alias supaya frontend lama tetap jalan
// app.use("/api/uploads", express.static("uploads"));
// app.use("/api/uploads", express.static("public/uploads"));
// app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

app.use('/uploads', express.static('/app/uploads'));
app.use('/api/uploads', express.static('/app/uploads'));

export default app;
startDeadlineNotifCron();
