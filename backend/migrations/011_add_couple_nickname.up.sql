-- Tambah nama panggilan mempelai (dipakai di tampilan cover)
ALTER TABLE wedding_couples ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) DEFAULT NULL;
