import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyMidtransSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return res.status(500).json({
        message: 'Server key tidak ditemukan',
      });
    }

    const { order_id, status_code, gross_amount, signature_key } = req.body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return res.status(400).json({
        message: 'Data webhook tidak lengkap',
      });
    }

    const hash = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex');

    if (hash !== signature_key) {
      return res.status(403).json({
        message: 'Invalid signature',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Signature verification error',
    });
  }
};
