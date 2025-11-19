-- Create tamu table in Supabase
CREATE TABLE IF NOT EXISTS tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kategori_id UUID NOT NULL REFERENCES kategori_tamu(id),
  hubungan_id UUID NOT NULL REFERENCES hubungan_tamu(id),
  alamat TEXT NOT NULL,
  nomor_hp VARCHAR(20) UNIQUE NOT NULL,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  status_undangan VARCHAR(20) NOT NULL DEFAULT 'belum_dikirim' CHECK (status_undangan IN ('dikirim', 'belum_dikirim', 'kadaluarsa')),
  konfirmasi_kehadiran VARCHAR(30) NOT NULL DEFAULT 'belum_konfirmasi' CHECK (konfirmasi_kehadiran IN ('akan_hadir', 'tidak_hadir', 'belum_konfirmasi')),
  tgl_kirim_undangan TIMESTAMP WITH TIME ZONE,
  tgl_baca_undangan TIMESTAMP WITH TIME ZONE,
  tgl_mulai_resepsi TIMESTAMP WITH TIME ZONE,
  tgl_akhir_resepsi TIMESTAMP WITH TIME ZONE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE tamu ENABLE ROW LEVEL SECURITY;

-- Create policy for RLS (adjust based on your authentication needs)
CREATE POLICY "Tamu are viewable by everyone" ON tamu
  FOR SELECT TO authenticated, anon
  USING (deleted_at IS NULL);

CREATE POLICY "Tamu can be created by authenticated users" ON tamu
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Tamu can be updated by authenticated users" ON tamu
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Tamu can be deleted by authenticated users" ON tamu
  FOR DELETE TO authenticated
  USING (true);