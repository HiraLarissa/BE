import mysql, { Pool } from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

export const db: Pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_tugas_akhir',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('Database pool berhasil dibuat');
