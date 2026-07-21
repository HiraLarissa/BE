import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

// custom payload
interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak ada' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format token salah' });
  }

  const token = parts[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as DefaultJwtPayload;

    req.user = {
      id: Number(decoded.id),
      email: String(decoded.email),
      role: String(decoded.role),
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid' });
  }
};
