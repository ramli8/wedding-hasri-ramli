export interface KategoriTamu {
  id: string;
  nama: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateKategoriTamuInput {
  nama: string;
}

export interface UpdateKategoriTamuInput {
  nama?: string;
}
