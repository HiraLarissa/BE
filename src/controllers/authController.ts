import { Request, Response } from 'express';
import { findUserByEmail, createUser, findUserByRole, findUserById, findArsitek } from '../models/userModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware';
import { updateUserProfile, updateUserFoto, updateUserPassword } from '../models/userModel';
import { OAuth2Client } from 'google-auth-library';
import { insertNotifikasi } from './notifikasiController';
import fs from 'fs';
import path from 'path';

const SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID belum diatur di file .env');
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ================= Register =================
export const register = async (req: Request, res: Response) => {
  const { nama, email, password, role, secretKey } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  let finalRole: 'klien' | 'arsitek' = 'klien';

  try {
    // cek email
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    if (role === 'arsitek') {
      const existingArsitek = await findUserByRole('arsitek');

      if (existingArsitek) {
        return res.status(403).json({ message: 'Akun arsitek sudah ada' });
      }

      if (secretKey !== 'ARSITEK123') {
        return res.status(403).json({ message: 'Secret key salah' });
      }

      finalRole = 'arsitek';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await createUser(nama, email, hashedPassword, finalRole);
    const newUser = await findUserByEmail(email);
    if (newUser) {
      insertNotifikasi(
        newUser.id,
        'Selamat Datang!',
        `Halo ${nama}, akun kamu berhasil dibuat. Selamat menggunakan layanan kami!`,
        'register'
      );
    }

    return res.json({
      message: 'User berhasil didaftarkan',
      role: finalRole,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// ================= Login =================
export const login = async (req: Request, res: Response) => {
  const { email, password, allowedRoles } = req.body;
  // allowedRoles dikirim dari frontend: ["klien"] untuk halaman klien

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // mencegah arsitek login di endpoint klien
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Akun dengan role "${user.role}" tidak diizinkan login di sini`,
      });
    }

    if (!user.password || String(user.password).trim() === '') {
      return res.status(400).json({
        message: 'Akun ini menggunakan login Google',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, {
      expiresIn: '1d',
    });

    insertNotifikasi(
      user.id,
      'Login Berhasil',
      `Halo ${user.nama}, kamu berhasil login pada ${new Date().toLocaleString('id-ID')}.`,
      'login'
    );

    return res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userLogin = req.user;

    if (!userLogin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await findUserById(userLogin.id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    return res.json({
      id: user.id,
      nama: user.nama,
      email: user.email,
      phone: user.phone || '',
      alamat: user.alamat || '',
      google_maps:user.google_maps || '',
      foto: user.foto || '',
      role: user.role,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userLogin = req.user;

    if (!userLogin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { nama, email, phone, alamat, google_maps } = req.body;

    await updateUserProfile(userLogin.id, nama, email, phone, alamat, google_maps);
    insertNotifikasi(
      userLogin.id,
      'Profil Diperbarui',
      'Data profil kamu berhasil diperbarui.',
      'profil'
    );

    return res.json({ message: 'Profile berhasil diupdate' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateFoto = async (req: AuthRequest, res: Response) => {
  try {
    const userLogin = req.user;

    if (!userLogin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'File tidak ada' });
    }

    const filename = req.file.filename;

    await updateUserFoto(userLogin.id, filename);

    insertNotifikasi(
      userLogin.id,
      'Foto Profil Diperbarui',
      'Foto profil kamu berhasil diperbarui.',
      'profil'
    );

    return res.json({
      message: 'Foto berhasil diupdate',
      foto: filename,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// ================= Hapus foto =================
export const hapusFoto = async (req: AuthRequest, res: Response) => {
  try {
    const userLogin = req.user;

    if (!userLogin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await findUserById(userLogin.id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.foto) {
      const filePath = path.join(process.cwd(), 'uploads', user.foto);

      fs.unlink(filePath, (err) => {
        if (err) {
        }
      });
    }

    await updateUserFoto(userLogin.id, '');

    insertNotifikasi(
      userLogin.id,
      'Foto Profil Dihapus',
      'Foto profil kamu berhasil dihapus dan kembali ke avatar default.',
      'profil'
    );

    return res.json({ message: 'Foto profil berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userLogin = req.user;

    if (!userLogin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { lama, baru } = req.body;

    if (!lama || !baru) {
      return res.status(400).json({ message: 'Password wajib diisi' });
    }

    const user = await findUserById(userLogin.id);

    const isMatch = await bcrypt.compare(lama, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    const hashedPassword = await bcrypt.hash(baru, 10);

    await updateUserPassword(userLogin.id, hashedPassword);
    insertNotifikasi(
      userLogin.id,
      'Password Diubah',
      'Password akun kamu berhasil diubah. Jika bukan kamu yang mengubah, segera hubungi kami.',
      'keamanan'
    );

    return res.json({ message: 'Password berhasil diupdate' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};
// ================= Google Login =================
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential, allowedRoles } = req.body;
    // allowedRoles dikirim dari frontend: ["klien"] untuk halaman klien

    if (!credential) {
      return res.status(400).json({ message: 'Credential Google tidak ditemukan' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: 'Akun Google tidak valid' });
    }

    const user = await findUserByEmail(payload.email);

    if (!user) {
      return res.status(404).json({
        message: 'Akun belum terdaftar. Silakan daftar terlebih dahulu.',
      });
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: `Akun dengan role "${user.role}" tidak diizinkan login di sini`,
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, {
      expiresIn: '1d',
    });

    insertNotifikasi(
      user.id,
      'Login Google Berhasil',
      `Halo ${user.nama}, kamu berhasil login menggunakan Google.`,
      'login'
    );

    return res.json({
      message: 'Login Google berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || 'Google login gagal',
    });
  }
};

// ================= Google Register =================
export const googleRegister = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Credential Google tidak ditemukan' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: 'Akun Google tidak valid' });
    }

    const existingUser = await findUserByEmail(payload.email);

    if (existingUser) {
      return res.status(400).json({
        message: 'Email ini sudah terdaftar. Silakan login.',
      });
    }

    await createUser(payload.name || 'User Google', payload.email, '', 'klien');
    const newUser = await findUserByEmail(payload.email);

    if (!newUser) {
      return res.status(500).json({
        message: 'Gagal membuat akun setelah registrasi Google',
      });
    }

    insertNotifikasi(
      newUser.id,
      'Selamat Datang!',
      `Halo ${newUser.nama}, akun kamu berhasil dibuat lewat Google. Selamat menggunakan layanan kami!`,
      'register'
    );

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, email: newUser.email },
      SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Registrasi Google berhasil',
      token,
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || 'Registrasi Google gagal',
    });
  }
};

export const getArsitekProfile = async (req: Request, res: Response) => {
  try {
    const arsitek = await findArsitek();

    if (!arsitek) {
      return res.status(404).json({
        message: "Data arsitek tidak ditemukan",
      });
    }

    return res.json({
      id: arsitek.id,
      nama: arsitek.nama,
      email: arsitek.email,
      phone: arsitek.phone || "",
      alamat: arsitek.alamat || "",
      google_maps: arsitek.google_maps || "",
      foto: arsitek.foto || "",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};