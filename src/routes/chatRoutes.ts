import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

import {
  createChatSession,
  getChatSessions,
  deleteChatSession,
  getChatMessages,
  sendChatbotMessage,
} from '../controllers/chatbotController';

const router = Router();

router.use(authMiddleware);

// Chatbot hanya untuk klien
const onlyKlien = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'klien') {
    return res.status(403).json({
      message: 'Chatbot hanya tersedia untuk klien',
    });
  }

  next();
};

router.use(onlyKlien);

// ================= SESSION =================
router.post('/sessions', createChatSession);
router.get('/sessions', getChatSessions);
router.delete('/sessions/:sessionId', deleteChatSession);

// ================= CHAT MESSAGES =================
router.get('/sessions/:sessionId/messages', getChatMessages);

// ================= AI CHAT =================
router.post('/message', sendChatbotMessage);

export default router;
