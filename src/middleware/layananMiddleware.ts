import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ada' });
  }

  try {
    const decoded = jwt.verify(token, 'SECRET_KEY');
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token tidak valid' });
  }
};
