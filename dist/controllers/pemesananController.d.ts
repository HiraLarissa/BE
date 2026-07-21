import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
export declare const getAllPemesanan: (req: Request, res: Response) => void;
export declare const getPemesananKlien: (req: AuthRequest, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const getPemesananById: (req: Request, res: Response) => void;
export declare const createPemesanan: (req: AuthRequest, res: Response) => Response<any, Record<string, any>> | undefined;
export declare const updatePemesanan: (req: AuthRequest, res: Response) => void;
export declare const deletePemesanan: (req: Request, res: Response) => void;
export declare const getAvailablePemesanan: (req: Request, res: Response) => void;
//# sourceMappingURL=pemesananController.d.ts.map