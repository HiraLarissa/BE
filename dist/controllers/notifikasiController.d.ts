import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
export declare const insertNotifikasi: (user_id: number, judul: string, pesan: string, type: string) => void;
export declare const getNotifikasi: (req: AuthRequest, res: Response) => void;
export declare const markAsRead: (req: AuthRequest, res: Response) => void;
export declare const markAllAsRead: (req: AuthRequest, res: Response) => void;
export declare const deleteNotifikasi: (req: AuthRequest, res: Response) => void;
//# sourceMappingURL=notifikasiController.d.ts.map