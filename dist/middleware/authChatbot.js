"use strict";
// import { Request, Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
Object.defineProperty(exports, "__esModule", { value: true });
// export interface ChatbotJwtPayload extends JwtPayload {
//   userId: string;
//   email: string;
//   role: string;
// }
// declare global {
//   namespace Express {
//     interface Request {
//       chatbotUser?: ChatbotJwtPayload;
//     }
//   }
// }
// export function authChatbot(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer ")) {
//     res.status(401).json({
//       success: false,
//       message: "Token tidak ditemukan",
//     });
//     return;
//   }
//   const token = authHeader.split(" ")[1]!;
//   try {
//     const secret = process.env.JWT_SECRET || "SECRET_KEY";
//     const payload = jwt.verify(
//       token,
//       secret
//     ) as unknown as ChatbotJwtPayload;
//     req.chatbotUser = payload;
//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: "Token tidak valid atau kadaluarsa",
//     });
//   }
// }
//# sourceMappingURL=authChatbot.js.map