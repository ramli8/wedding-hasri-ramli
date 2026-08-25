-- Jam selesai acara (opsional); jam final resepsi per tamu mengikuti kategori tamu.
ALTER TABLE wedding_events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ DEFAULT NULL;
