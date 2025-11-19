-- Create kategori_tamu master table
CREATE TABLE IF NOT EXISTS kategori_tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create hubungan_tamu master table
CREATE TABLE IF NOT EXISTS hubungan_tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE kategori_tamu ENABLE ROW LEVEL SECURITY;
ALTER TABLE hubungan_tamu ENABLE ROW LEVEL SECURITY;

-- Create policies for kategori_tamu
CREATE POLICY "Kategori tamu are viewable by everyone" ON kategori_tamu
  FOR SELECT TO authenticated, anon
  USING (deleted_at IS NULL);

CREATE POLICY "Kategori tamu can be created by authenticated users" ON kategori_tamu
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Kategori tamu can be updated by authenticated users" ON kategori_tamu
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Kategori tamu can be deleted by authenticated users" ON kategori_tamu
  FOR DELETE TO authenticated
  USING (true);

-- Create policies for hubungan_tamu
CREATE POLICY "Hubungan tamu are viewable by everyone" ON hubungan_tamu
  FOR SELECT TO authenticated, anon
  USING (deleted_at IS NULL);

CREATE POLICY "Hubungan tamu can be created by authenticated users" ON hubungan_tamu
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Hubungan tamu can be updated by authenticated users" ON hubungan_tamu
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Hubungan tamu can be deleted by authenticated users" ON hubungan_tamu
  FOR DELETE TO authenticated
  USING (true);

-- Insert default data for kategori_tamu
INSERT INTO kategori_tamu (nama) VALUES
  ('Tamu Hasri'),
  ('Tamu Ramli'),
  ('Tamu Ayah'),
  ('Tamu Ibu')
ON CONFLICT (nama) DO NOTHING;

-- Insert default data for hubungan_tamu
INSERT INTO hubungan_tamu (nama) VALUES
  ('Teman SD'),
  ('Teman SMP'),
  ('Teman SMA'),
  ('Teman Kuliah'),
  ('Teman Kerja'),
  ('Tetangga'),
  ('Saudara'),
  ('Lainnya')
ON CONFLICT (nama) DO NOTHING;

-- Create trigger to update updated_at timestamp for kategori_tamu
CREATE OR REPLACE FUNCTION update_kategori_tamu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kategori_tamu_updated_at
  BEFORE UPDATE ON kategori_tamu
  FOR EACH ROW
  EXECUTE FUNCTION update_kategori_tamu_updated_at();

-- Create trigger to update updated_at timestamp for hubungan_tamu
CREATE OR REPLACE FUNCTION update_hubungan_tamu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hubungan_tamu_updated_at
  BEFORE UPDATE ON hubungan_tamu
  FOR EACH ROW
  EXECUTE FUNCTION update_hubungan_tamu_updated_at();
