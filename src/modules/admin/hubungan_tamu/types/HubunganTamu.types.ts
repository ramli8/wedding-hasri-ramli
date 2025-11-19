export interface HubunganTamu {
  id: string;
  nama: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreateHubunganTamuInput {
  nama: string;
}

export interface UpdateHubunganTamuInput {
  nama?: string;
}
