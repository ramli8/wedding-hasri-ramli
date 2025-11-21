export interface Ucapan {
  id: string;
  tamu_id?: string;
  user_id?: string;
  parent_id?: string;
  nama: string;
  pesan: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UcapanWithReplies extends Ucapan {
  replies?: Ucapan[];
}

export interface CreateUcapanData {
  nama: string;
  pesan: string;
  tamu_id?: string;
  user_id?: string;
  parent_id?: string;
  is_admin?: boolean;
}
