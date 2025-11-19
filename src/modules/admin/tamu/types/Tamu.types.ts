export interface Tamu {
  id: string;
  nama: string;
  kategori: 'Tamu Hasri' | 'Tamu Ramli' | 'Tamu Ayah' | 'Tamu Ibu';
  hubungan: 'Teman SD' | 'Teman SMP' | 'Teman SMA' | 'Teman Kuliah' | 'Teman Kerja' | 'Tetangga' | 'Saudara' | 'Lainnya';
  alamat: string;
  nomor_hp: string;
  qr_code: string;
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
  kategori: Tamu['kategori'];
  hubungan: Tamu['hubungan'];
  alamat: string;
  nomor_hp: string;
  status_undangan?: Tamu['status_undangan'];
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
  tgl_mulai_resepsi?: Date;
  tgl_akhir_resepsi?: Date;
}

export interface UpdateTamuInput {
  nama?: string;
  kategori?: Tamu['kategori'];
  hubungan?: Tamu['hubungan'];
  alamat?: string;
  nomor_hp?: string;
  status_undangan?: Tamu['status_undangan'];
  konfirmasi_kehadiran?: Tamu['konfirmasi_kehadiran'];
  tgl_kirim_undangan?: Date;
  tgl_baca_undangan?: Date;
  tgl_mulai_resepsi?: Date;
  tgl_akhir_resepsi?: Date;
  check_in?: Date;
  check_out?: Date;
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
  page?: number;
  limit?: number;
}