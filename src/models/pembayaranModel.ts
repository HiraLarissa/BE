export interface Pembayaran {
  id?: number;
  pemesanan_id: number;
  total: number;
  status: "pending" | "success" | "failed" | "expired";
  created_at?: Date;
  order_id: string;
  snap_token: string;
  metode?: string;
  payment_type?: string | null;
  transaction_status?: string | null;
  fraud_status?: string | null;
}