"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPassword = exports.updateUserFoto = exports.updateUserProfile = exports.findUserById = exports.createUser = exports.findUserByRole = exports.findUserByEmail = void 0;
const db_1 = require("../config/db");
// ================= FIND BY EMAIL =================
const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
        db_1.db.query(sql, [email], (err, results) => {
            if (err)
                return reject(err);
            resolve(results[0]); // ambil 1 user
        });
    });
};
exports.findUserByEmail = findUserByEmail;
// ================= FIND BY ROLE =================
const findUserByRole = (role) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE role = ? LIMIT 1";
        db_1.db.query(sql, [role], (err, results) => {
            if (err)
                return reject(err);
            resolve(results[0]);
        });
    });
};
exports.findUserByRole = findUserByRole;
// ================= CREATE USER =================
const createUser = (nama, email, password, role) => {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO users (nama, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
        db_1.db.query(sql, [nama, email, password, role], (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
};
exports.createUser = createUser;
const findUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
        db_1.db.query(sql, [id], (err, results) => {
            if (err)
                return reject(err);
            resolve(results[0]);
        });
    });
};
exports.findUserById = findUserById;
const updateUserProfile = (id, nama, email, phone, alamat) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE users 
      SET nama = ?, email = ?, phone = ?, alamat = ?
      WHERE id = ?
    `;
        db_1.db.query(sql, [nama, email, phone, alamat, id], (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
};
exports.updateUserProfile = updateUserProfile;
const updateUserFoto = (id, foto) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE users 
      SET foto = ?
      WHERE id = ?
    `;
        db_1.db.query(sql, [foto, id], (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
};
exports.updateUserFoto = updateUserFoto;
const updateUserPassword = (id, password) => {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE users 
      SET password = ?
      WHERE id = ?
    `;
        db_1.db.query(sql, [password, id], (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
};
exports.updateUserPassword = updateUserPassword;
//# sourceMappingURL=userModel.js.map