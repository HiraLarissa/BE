"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const chatbotController_1 = require("../controllers/chatbotController");
const router = (0, express_1.Router)();
// Semua route wajib login
router.use(authMiddleware_1.authMiddleware);
// Chatbot hanya untuk klien
const onlyKlien = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "klien") {
        return res.status(403).json({
            message: "Chatbot hanya tersedia untuk klien",
        });
    }
    next();
};
router.use(onlyKlien);
// ================= SESSION =================
router.post("/sessions", chatbotController_1.createChatSession);
router.get("/sessions", chatbotController_1.getChatSessions);
router.delete("/sessions/:sessionId", chatbotController_1.deleteChatSession);
// ================= CHAT MESSAGES =================
router.get("/sessions/:sessionId/messages", chatbotController_1.getChatMessages);
// ================= AI CHAT =================
router.post("/message", chatbotController_1.sendChatbotMessage);
exports.default = router;
//# sourceMappingURL=chatRoutes.js.map