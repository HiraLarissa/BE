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
exports.googleLogin = exports.updatePassword = exports.hapusFoto = exports.updateFoto = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const userModel_1 = require("../models/userModel");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userModel_2 = require("../models/userModel");
const google_auth_library_1 = require("google-auth-library");
const notifikasiController_1 = require("./notifikasiController");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SECRET = process.env.JWT_SECRET || "SECRET_KEY";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID belum diatur di file .env");
}
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
// ================= Register =================
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nama, email, password, role, secretKey } = req.body;
    if (!nama || !email || !password) {
        return res.status(400).json({ message: "Semua field wajib diisi" });
    }
    let finalRole = "klien";
    try {
        // cek email
        const existingUser = yield (0, userModel_1.findUserByEmail)(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }
        // khusus arsitek (hanya 1 akun)
        if (role === "arsitek") {
            const existingArsitek = yield (0, userModel_1.findUserByRole)("arsitek");
            if (existingArsitek) {
                return res.status(403).json({ message: "Akun arsitek sudah ada" });
            }
            if (secretKey !== "ARSITEK123") {
                return res.status(403).json({ message: "Secret key salah" });
            }
            finalRole = "arsitek";
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield (0, userModel_1.createUser)(nama, email, hashedPassword, finalRole);
        const newUser = yield (0, userModel_1.findUserByEmail)(email);
        if (newUser) {
            (0, notifikasiController_1.insertNotifikasi)(newUser.id, "Selamat Datang!", `Halo ${nama}, akun kamu berhasil dibuat. Selamat menggunakan layanan kami!`, "register");
        }
        return res.json({
            message: "User berhasil didaftarkan",
            role: finalRole,
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});
exports.register = register;
// ================= Login =================
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    console.log("BODY:", req.body);
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
    }
    try {
        const user = yield (0, userModel_1.findUserByEmail)(email);
        console.log("USER:", user);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        if (!user.password || String(user.password).trim() === "") {
            return res.status(400).json({
                message: "Akun ini menggunakan login Google",
            });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: "1d" });
        (0, notifikasiController_1.insertNotifikasi)(user.id, "Login Berhasil", `Halo ${user.nama}, kamu berhasil login pada ${new Date().toLocaleString("id-ID")}.`, "login");
        return res.json({
            message: "Login berhasil",
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("LOGIN ERROR DETAIL:", err.message);
        return res.status(500).json({ message: err.message });
    }
});
exports.login = login;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userLogin = req.user;
        if (!userLogin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = yield (0, userModel_1.findUserById)(userLogin.id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        return res.json({
            id: user.id,
            nama: user.nama,
            email: user.email,
            phone: user.phone || "",
            alamat: user.alamat || "",
            foto: user.foto || "",
            role: user.role,
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userLogin = req.user;
        if (!userLogin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { nama, email, phone, alamat } = req.body;
        yield (0, userModel_2.updateUserProfile)(userLogin.id, nama, email, phone, alamat);
        (0, notifikasiController_1.insertNotifikasi)(userLogin.id, "Profil Diperbarui", "Data profil kamu berhasil diperbarui.", "profil");
        return res.json({ message: "Profile berhasil diupdate" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.updateProfile = updateProfile;
const updateFoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userLogin = req.user;
        if (!userLogin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "File tidak ada" });
        }
        const filename = req.file.filename;
        yield (0, userModel_2.updateUserFoto)(userLogin.id, filename);
        (0, notifikasiController_1.insertNotifikasi)(userLogin.id, "Foto Profil Diperbarui", "Foto profil kamu berhasil diperbarui.", "profil");
        return res.json({
            message: "Foto berhasil diupdate",
            foto: filename,
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.updateFoto = updateFoto;
// ================= Hapus foto =================
const hapusFoto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userLogin = req.user;
        if (!userLogin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = yield (0, userModel_1.findUserById)(userLogin.id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        // kalau ada file foto lama, hapus juga file fisiknya di server
        if (user.foto) {
            const filePath = path_1.default.join(process.cwd(), "uploads", user.foto);
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.error("Gagal menghapus file foto lama:", err.message);
                }
            });
        }
        yield (0, userModel_2.updateUserFoto)(userLogin.id, "");
        (0, notifikasiController_1.insertNotifikasi)(userLogin.id, "Foto Profil Dihapus", "Foto profil kamu berhasil dihapus dan kembali ke avatar default.", "profil");
        return res.json({ message: "Foto profil berhasil dihapus" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.hapusFoto = hapusFoto;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userLogin = req.user;
        if (!userLogin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { lama, baru } = req.body;
        if (!lama || !baru) {
            return res.status(400).json({ message: "Password wajib diisi" });
        }
        const user = yield (0, userModel_1.findUserById)(userLogin.id);
        const isMatch = yield bcrypt_1.default.compare(lama, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password lama salah" });
        }
        // hash password baru
        const hashedPassword = yield bcrypt_1.default.hash(baru, 10);
        yield (0, userModel_2.updateUserPassword)(userLogin.id, hashedPassword);
        (0, notifikasiController_1.insertNotifikasi)(userLogin.id, "Password Diubah", "Password akun kamu berhasil diubah. Jika bukan kamu yang mengubah, segera hubungi kami.", "keamanan");
        return res.json({ message: "Password berhasil diupdate" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.updatePassword = updatePassword;
const googleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: "Credential Google tidak ditemukan" });
        }
        const ticket = yield client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!(payload === null || payload === void 0 ? void 0 : payload.email)) {
            return res.status(400).json({ message: "Akun Google tidak valid" });
        }
        let user = yield (0, userModel_1.findUserByEmail)(payload.email);
        // Kalau belum ada, buat akun baru
        if (!user) {
            yield (0, userModel_1.createUser)(payload.name || "User Google", payload.email, "", "klien");
            user = yield (0, userModel_1.findUserByEmail)(payload.email);
        }
        if (!user) {
            return res.status(500).json({
                message: "Gagal mengambil data user setelah login Google",
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
            email: user.email,
        }, SECRET, { expiresIn: "1d" });
        (0, notifikasiController_1.insertNotifikasi)(user.id, "Login Google Berhasil", `Halo ${user.nama}, kamu berhasil login menggunakan Google.`, "login");
        return res.json({
            message: "Login Google berhasil",
            token,
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (err) {
        console.error("GOOGLE LOGIN ERROR DETAIL:", err);
        return res.status(500).json({
            message: (err === null || err === void 0 ? void 0 : err.message) || "Google login gagal",
        });
    }
});
exports.googleLogin = googleLogin;
//# sourceMappingURL=authController.js.map