export interface Pemesanan {
  id?: number;
  user_id?: number;
  layanan_id?: number;
  jenis_bangunan: string;
  luas_lahan: number;
  jumlah_lantai: string;
  jumlah_ruangan: number;
  konsep_desain: string;
  estimasi_anggaran: number;
  kebutuhan_khusus: string;
  status?: "pending" | "proses" | "selesai";
  source?: "kebutuhan" | "rekomendasi";
  harga_final?: number;
  gambar?: string | null;               
  gambar_rekomendasi?: string | null;   
  created_at?: Date;
}