export interface Layanan {
  id?: number;
  nama_layanan: string;
  deskripsi: string;
  harga: number;
  created_at?: Date;
  gambar?: string;
  luas?: number;
  kamar?: number;
  lantai?: number;
  area?: number;
  ruangan?: number;
  jenis_bangunan?: string;
  konsep_desain?: string;
}