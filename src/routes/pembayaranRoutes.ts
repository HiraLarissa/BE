import express from "express";
import {
  createPayment,
  handleMidtransWebhook,
  getAllPembayaran,
  checkAndUpdatePaymentStatus
} from "../controllers/pembayaranController";

import { verifyMidtransSignature } from "../middleware/midtransMiddleware";

const router = express.Router();
router.post("/payment", createPayment);
router.get("/", getAllPembayaran);
router.get("/check/:order_id", checkAndUpdatePaymentStatus);
router.post(
  "/payment/webhook",
  verifyMidtransSignature,
  handleMidtransWebhook
);

export default router;