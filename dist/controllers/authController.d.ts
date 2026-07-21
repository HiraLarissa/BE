import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFoto: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const hapusFoto: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePassword: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const googleLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map