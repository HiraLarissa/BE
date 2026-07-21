export interface HasilDesain {
  id?: number;
  pemesanan_id: number;
  keterangan?: string | null;
  denah_url?: string | null;
  gambar_url?: string | null;
  file3d_url?: string | null;
  status?: 'proses' | 'selesai' | 'revisi';
  created_at?: string;
  updated_at?: string;
}
