export interface Tamu {
  id: string;
  nama: string;
  kategori_id: string; // UUID reference to kategori_tamu
  hubungan_id: string; // UUID reference to hubungan_tamu
  kategori?: string; // Display name (populated from join)
  hubungan?: string; // Display name (populated from join)
  alamat: string;
  nomor_hp: string;
  qr_code: string;
  kode_unik?: string; // Alias for qr_code or separate unique code
  status_undangan: 'dikirim' | 'belum_dikirim' | 'kadaluarsa';
  konfirmasi_kehadiran: 'akan_hadir' | 'tidak_hadir' | 'belum_konfirmasi';
  tgl_kirim_undangan?: Date;
  tgl_baca_undangan?: Date;
  tgl_mulai_resepsi?: Date;
  tgl_akhir_resepsi?: Date;
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
  nomor_hp: string;
  status_undangan?: Tamu['status_undangan'];
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
  tgl_mulai_resepsi?: Date | string; // Accept both Date and ISO string
  tgl_akhir_resepsi?: Date | string; // Accept both Date and ISO string
}

export interface UpdateTamuInput {
  nama?: string;
  kategori_id?: string; // UUID
  hubungan_id?: string; // UUID
  alamat?: string;
  nomor_hp?: string;
  status_undangan?: Tamu['status_undangan'];
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
  tgl_kirim_undangan?: Date | string;
  tgl_baca_undangan?: Date | string;
  tgl_mulai_resepsi?: Date | string; // Accept both Date and ISO string
  tgl_akhir_resepsi?: Date | string; // Accept both Date and ISO string
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
  status_undangan?: string;
  konfirmasi_kehadiran?: string;
  search?: string;
  status?: 'all' | 'active' | 'inactive'; // Filter untuk deleted status
  page?: number;
  limit?: number;
}