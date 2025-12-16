export interface Tamu {
  id: string;
  nama: string;
  kategori_id: string; // UUID reference to kategori_tamu
  hubungan_id: string; // UUID reference to hubungan_tamu
  kategori?: string; // Display name (populated from join)
  hubungan?: string; // Display name (populated from join)
  alamat: string;
  nomor_hp?: string;
  username_instagram?: string;
  qr_code: string;
  kode_unik?: string; // Alias for qr_code or separate unique code
  konfirmasi_kehadiran: 'akan_hadir' | 'tidak_hadir' | 'belum_konfirmasi';
  tgl_kirim_undangan?: Date;
  tgl_baca_undangan?: Date;
  tgl_kirim_cek_qr_code?: Date;
  tgl_baca_cek_qr_code?: Date;
  check_in?: Date;
  check_out?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateTamuInput {
  nama: string;
  kategori_id: string; // UUID
  hubungan_id: string; // UUID
  alamat: string;
  nomor_hp?: string | null;
  username_instagram?: string | null;
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
}

export interface UpdateTamuInput {
  nama?: string;
  kategori_id?: string; // UUID
  hubungan_id?: string; // UUID
  alamat?: string;
  nomor_hp?: string | null;
  username_instagram?: string | null;
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
  tgl_kirim_undangan?: Date | string;
  tgl_baca_undangan?: Date | string;
  tgl_kirim_cek_qr_code?: Date | string;
  tgl_baca_cek_qr_code?: Date | string;
  check_in?: Date | string;
  check_out?: Date | string;
}

export interface TamuApiResponse {
  data: Tamu[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TamuFilter {
  kategori?: string;
  hubungan?: string;
  konfirmasi_kehadiran?: string;
  search?: string;
  status?: 'all' | 'active' | 'inactive'; // Filter untuk deleted status
  page?: number;
  limit?: number;
}
