import { db } from '../config/db';

// ================= FIND BY EMAIL =================
export const findUserByEmail = (email: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';

    db.query(sql, [email], (err, results: any) => {
      if (err) return reject(err);
      resolve(results[0]); // ambil 1 user
    });
  });
};

// ================= FIND BY ROLE =================
export const findUserByRole = (role: 'klien' | 'arsitek'): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE role = ? LIMIT 1';

    db.query(sql, [role], (err, results: any) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const findArsitek = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM users
      WHERE role = 'arsitek'
      LIMIT 1
    `;

    db.query(sql, (err, results: any) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

// ================= CREATE USER =================
export const createUser = (
  nama: string,
  email: string,
  password: string,
  role: 'klien' | 'arsitek'
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (nama, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [nama, email, password, role], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const findUserById = (id: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';

    db.query(sql, [id], (err, results: any) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

export const updateUserProfile = (
  id: number,
  nama: string,
  email: string,
  phone: string,
  alamat: string,
  google_maps: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users 
      SET nama = ?, email = ?, phone = ?, alamat = ?, google_maps = ?
      WHERE id = ?
    `;

    db.query(sql, [nama, email, phone, alamat, google_maps, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateUserFoto = (id: number, foto: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users 
      SET foto = ?
      WHERE id = ?
    `;

    db.query(sql, [foto, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateUserPassword = (id: number, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE users 
      SET password = ?
      WHERE id = ?
    `;

    db.query(sql, [password, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
