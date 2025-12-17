export interface KategoriTamu {
  id: string;
  nama: string;
  jam_mulai: string; // HH:mm:ss
  jam_selesai: string; // HH:mm:ss
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateKategoriTamuInput {
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface UpdateKategoriTamuInput {
  nama?: string;
  jam_mulai?: string;
  jam_selesai?: string;
}
