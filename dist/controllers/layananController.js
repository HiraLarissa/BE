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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLayanan = exports.updateLayanan = exports.createLayanan = exports.getLayananById = exports.getAllLayanan = exports.upload = void 0;
const db_1 = require("../config/db");
const multer_1 = __importDefault(require("multer"));
// simpan ke folder
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads"); // pastikan folder ini ada!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const normalize = (val) => {
    return val === null || val === void 0 ? void 0 : val.toLowerCase().trim();
};
exports.upload = (0, multer_1.default)({ storage });
// GET ALL
const getAllLayanan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        db_1.db.query("SELECT * FROM layanan", (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Gagal mengambil data layanan" });
            }
            res.json(rows);
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error server" });
    }
});
exports.getAllLayanan = getAllLayanan;
// GET BY ID
const getLayananById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        db_1.db.query("SELECT * FROM layanan WHERE id = ?", [id], (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Error server" });
            }
            if (rows.length === 0) {
                return res.status(404).json({ message: "Layanan tidak ditemukan" });
            }
            res.json(rows[0]);
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error server" });
    }
});
exports.getLayananById = getLayananById;
// CREATE
const createLayanan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { nama_layanan, deskripsi, harga, luas, kamar, lantai, area, ruangan, jenis_bangunan, konsep_desain } = req.body;
        // ambil file dari multer
        const gambar = req.file ? req.file.filename : null;
        const jenisFix = normalize(jenis_bangunan);
        const konsepFix = normalize(konsep_desain);
        if (!nama_layanan || !harga) {
            return res.status(400).json({ message: "Data wajib diisi" });
        }
        db_1.db.query(`INSERT INTO layanan 
      (nama_layanan, deskripsi, harga, gambar, luas, kamar, lantai, area, ruangan, jenis_bangunan, konsep_desain) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            nama_layanan,
            deskripsi,
            harga,
            gambar,
            luas || null,
            kamar || null,
            lantai || null,
            area || null,
            ruangan || null,
            jenisFix,
            konsepFix,
        ], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Gagal menambah layanan" });
            }
            return res.status(201).json({
                message: "Layanan berhasil ditambahkan",
                id: result.insertId,
                gambar,
            });
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error server" });
    }
});
exports.createLayanan = createLayanan;
// UPDATE
const updateLayanan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { nama_layanan, deskripsi, harga, luas, kamar, lantai, area, ruangan, jenis_bangunan, konsep_desain } = req.body;
        const gambar = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);
        let query = "UPDATE layanan SET ";
        let values = [];
        if (nama_layanan) {
            query += "nama_layanan=?, ";
            values.push(nama_layanan);
        }
        if (deskripsi) {
            query += "deskripsi=?, ";
            values.push(deskripsi);
        }
        if (harga) {
            query += "harga=?, ";
            values.push(harga);
        }
        if (gambar) {
            query += "gambar=?, ";
            values.push(gambar);
        }
        if (luas) {
            query += "luas=?, ";
            values.push(luas);
        }
        if (kamar) {
            query += "kamar=?, ";
            values.push(kamar);
        }
        if (lantai) {
            query += "lantai=?, ";
            values.push(lantai);
        }
        if (area) {
            query += "area=?, ";
            values.push(area);
        }
        if (ruangan) {
            query += "ruangan=?, ";
            values.push(ruangan);
        }
        if (jenis_bangunan !== undefined) {
            query += "jenis_bangunan=?, ";
            values.push(jenis_bangunan || null);
        }
        if (konsep_desain) {
            query += "konsep_desain=?, ";
            values.push(konsep_desain);
        }
        if (values.length === 0) {
            return res.status(400).json({ message: "Tidak ada data yang diupdate" });
        }
        query = query.replace(/,\s*$/, "");
        query += " WHERE id=?";
        values.push(Number(id));
        db_1.db.query(query, values, (err, result) => {
            if (err) {
                console.log("MYSQL ERROR:", err);
                return res.status(500).json({ message: "Gagal update layanan" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Layanan tidak ditemukan" });
            }
            res.json({ message: "Update berhasil" });
        });
    }
    catch (error) {
        console.log("SERVER ERROR:", error);
        res.status(500).json({ message: "Error server" });
    }
});
exports.updateLayanan = updateLayanan;
// DELETE
const deleteLayanan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        db_1.db.query("DELETE FROM layanan WHERE id=?", [id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Gagal hapus layanan" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Layanan tidak ditemukan" });
            }
            res.json({ message: "Layanan berhasil dihapus" });
        });
    }
    catch (error) {
        res.status(500).json({ message: "Error server" });
    }
});
exports.deleteLayanan = deleteLayanan;
//# sourceMappingURL=layananController.js.map