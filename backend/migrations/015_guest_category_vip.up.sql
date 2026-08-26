-- Tandai kategori tamu sebagai VIP (tampil beda di undangan & laporan).
ALTER TABLE guest_categories ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE;
