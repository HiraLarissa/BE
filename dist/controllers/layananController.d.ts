import { Request, Response } from "express";
import multer from "multer";
export declare const upload: multer.Multer;
export declare const getAllLayanan: (req: Request, res: Response) => Promise<void>;
export declare const getLayananById: (req: Request, res: Response) => Promise<void>;
export declare const createLayanan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateLayanan: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteLayanan: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=layananController.d.ts.map