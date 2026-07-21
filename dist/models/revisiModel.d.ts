export interface Revisi {
    id?: number;
    pemesanan_id: number;
    jenis_revisi: string;
    catatan: string;
    file_referensi?: string;
    status?: "menunggu" | "diproses" | "selesai";
    revisi_ke?: number;
    created_at?: Date;
}
//# sourceMappingURL=revisiModel.d.ts.map