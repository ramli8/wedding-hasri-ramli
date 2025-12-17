DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- ============================================
-- Complete Database Schema for Wedding App
-- Including: Tamu, Ucapan, Users, Roles
-- Run this on fresh Supabase database
-- ============================================

-- ============================================
-- 1. CREATE MASTER TABLES
-- ============================================

-- Create pengaturan_pernikahan table (singleton - only 1 row)
CREATE TABLE IF NOT EXISTS pengaturan_pernikahan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Data Mempelai Pria
  nama_lengkap_pria VARCHAR(100) NOT NULL,
  nama_panggilan_pria VARCHAR(50) NOT NULL,
  nama_ayah_pria VARCHAR(100),
  nama_ibu_pria VARCHAR(100),
  anak_ke_pria VARCHAR(20),
  
  -- Data Mempelai Wanita
  nama_lengkap_wanita VARCHAR(100) NOT NULL,
  nama_panggilan_wanita VARCHAR(50) NOT NULL,
  nama_ayah_wanita VARCHAR(100),
  nama_ibu_wanita VARCHAR(100),
  anak_ke_wanita VARCHAR(20),
  
  -- Acara Akad/Pemberkatan
  tanggal_akad DATE NOT NULL,
  jam_mulai_akad TIME NOT NULL,
  jam_selesai_akad TIME,
  nama_tempat_akad VARCHAR(150) NOT NULL,
  alamat_akad TEXT NOT NULL,
  link_maps_akad TEXT,
  
  -- Acara Resepsi (waktu resepsi diambil dari kategori_tamu)
  tanggal_resepsi DATE NOT NULL,
  nama_tempat_resepsi VARCHAR(150) NOT NULL,
  alamat_resepsi TEXT NOT NULL,
  link_maps_resepsi TEXT,
  
  -- Media
  musik_latar VARCHAR(255),
  
  -- Fitur Digital
  link_streaming VARCHAR(255),
  
  -- Gift/Amplop Digital - Bank 1
  bank_1 VARCHAR(50),
  nomor_rekening_1 VARCHAR(50),
  atas_nama_1 VARCHAR(100),
  
  -- Gift/Amplop Digital - Bank 2 (Opsional)
  bank_2 VARCHAR(50),
  nomor_rekening_2 VARCHAR(50),
  atas_nama_2 VARCHAR(100),
  
  -- Template WhatsApp
  text_undangan TEXT,
  text_pengingat_qr_code TEXT,
  
  -- SEO & Sharing
  meta_title VARCHAR(100),
  meta_description VARCHAR(200),
  og_image VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kategori_tamu master table
CREATE TABLE IF NOT EXISTS kategori_tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
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

-- ============================================
-- 2. CREATE MAIN TAMU TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kategori_id UUID NOT NULL REFERENCES kategori_tamu(id),
  hubungan_id UUID NOT NULL REFERENCES hubungan_tamu(id),
  alamat TEXT NOT NULL,
  nomor_hp VARCHAR(20) UNIQUE,
  username_instagram VARCHAR(100),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  konfirmasi_kehadiran VARCHAR(30) NOT NULL DEFAULT 'belum_konfirmasi' CHECK (konfirmasi_kehadiran IN ('akan_hadir', 'tidak_hadir', 'belum_konfirmasi')),
  tgl_kirim_undangan TIMESTAMP WITH TIME ZONE,
  tgl_baca_undangan TIMESTAMP WITH TIME ZONE,
  tgl_kirim_cek_qr_code TIMESTAMP WITH TIME ZONE,
  tgl_baca_cek_qr_code TIMESTAMP WITH TIME ZONE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. CREATE USER & ROLE TABLES
-- ============================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create user_roles table (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Create role_permissions table for URL access control
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  url_pattern VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create partial unique index for active permissions (soft delete support)
CREATE UNIQUE INDEX idx_role_permissions_unique_active 
ON role_permissions (role_id, url_pattern) 
WHERE deleted_at IS NULL;

-- Create function to ensure only one default role
CREATE OR REPLACE FUNCTION ensure_single_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this role as default
  IF NEW.is_default = true THEN
    -- Unset all other roles as default
    UPDATE roles 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default role
DROP TRIGGER IF EXISTS trigger_ensure_single_default_role ON roles;
CREATE TRIGGER trigger_ensure_single_default_role
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_role();

-- Add comment for documentation
COMMENT ON COLUMN roles.is_default IS 'Indicates if this is the default role. Only one role can be default at a time.';

-- ============================================
-- 4. CREATE UCAPAN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS ucapan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tamu_id UUID REFERENCES tamu(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES ucapan(id),
  nama VARCHAR(255) NOT NULL,
  pesan TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX idx_ucapan_tamu_id ON ucapan(tamu_id);
CREATE INDEX idx_ucapan_parent_id ON ucapan(parent_id);
CREATE INDEX idx_ucapan_user_id ON ucapan(user_id);

-- ============================================
-- 5. INSERT DUMMY DATA - MASTER TABLES
-- ============================================

-- Insert pengaturan_pernikahan dummy data (singleton)
INSERT INTO pengaturan_pernikahan (
  -- Data Mempelai Pria
  nama_lengkap_pria, nama_panggilan_pria, nama_ayah_pria, nama_ibu_pria, anak_ke_pria,
  -- Data Mempelai Wanita
  nama_lengkap_wanita, nama_panggilan_wanita, nama_ayah_wanita, nama_ibu_wanita, anak_ke_wanita,
  -- Acara Akad
  tanggal_akad, jam_mulai_akad, jam_selesai_akad, nama_tempat_akad, alamat_akad, link_maps_akad,
  -- Acara Resepsi (waktu dari kategori_tamu)
  tanggal_resepsi, nama_tempat_resepsi, alamat_resepsi, link_maps_resepsi,
  -- Media & Fitur Digital
  musik_latar, link_streaming,
  -- Gift Bank 1
  bank_1, nomor_rekening_1, atas_nama_1,
  -- Gift Bank 2
  bank_2, nomor_rekening_2, atas_nama_2,
  -- Template WhatsApp
  text_undangan, text_pengingat_qr_code,
  -- SEO
  meta_title, meta_description, og_image
) VALUES (
  -- Data Mempelai Pria
  'Muhammad Ramli Saputra', 'Ramli', 'H. Ahmad Saputra', 'Hj. Siti Aminah', 'Pertama',
  -- Data Mempelai Wanita
  'Hasri Nur Fadillah', 'Hasri', 'H. Budi Santoso', 'Hj. Fatimah', 'Kedua',
  -- Acara Akad
  '2025-02-14', '08:00', '10:00', 'Masjid Agung Al-Azhar', 'Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan', 'https://maps.google.com/?q=Masjid+Agung+Al-Azhar',
  -- Acara Resepsi (waktu dari kategori_tamu)
  '2025-02-14', 'Balai Kartini', 'Jl. Gatot Subroto Kav. 37, Jakarta Selatan', 'https://maps.google.com/?q=Balai+Kartini+Jakarta',
  -- Media & Fitur Digital
  '/audio/wedding-music.mp3', 'https://youtube.com/live/example',
  -- Gift Bank 1
  'BCA', '1234567890', 'Muhammad Ramli Saputra',
  -- Gift Bank 2
  'Mandiri', '0987654321', 'Hasri Nur Fadillah',
  -- Template WhatsApp
  'Kepada Yth.
Bapak/Ibu/Saudara/i
*{{nama_tamu}}*
_______

Assalamualaikum Warahmatullahi Wabarakatuh

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i, teman sekaligus sahabat, untuk menghadiri acara pernikahan kami.

Berikut link undangan kami, untuk info lengkap dari acara, bisa kunjungi :

{{link_undangan}}

Merupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

Wassalamualaikum Warahmatullahi Wabarakatuh

Terima Kasih

Hormat kami,
*{{nama_pria}} & {{nama_wanita}}*',
  'Kepada Yth.
Bapak/Ibu/Saudara/i
*{{nama_tamu}}*
_______

Assalamualaikum Warahmatullahi Wabarakatuh

Untuk mengecek QR Code undangan Anda, silakan kunjungi link berikut:
{{link_qr_code}}

Harap tunjukkan QR Code ini saat registrasi di lokasi acara.

Wassalamualaikum Warahmatullahi Wabarakatuh

Hormat kami,
*{{nama_pria}} & {{nama_wanita}}*',
  -- SEO
  'Pernikahan Hasri & Ramli', 'Kami mengundang Anda untuk hadir di acara pernikahan kami. Hasri & Ramli - 14 Februari 2025', '/images/og-wedding.jpg'
);

-- Insert kategori_tamu dummy data
INSERT INTO kategori_tamu (nama, jam_mulai, jam_selesai) VALUES
  ('Tamu Hasri', '08:00', '10:00'),
  ('Tamu Ramli', '10:00', '12:00'),
  ('Tamu Ayah', '13:00', '15:00'),
  ('Tamu Ibu', '15:00', '17:00')
ON CONFLICT (nama) DO NOTHING;

-- Insert hubungan_tamu dummy data
INSERT INTO hubungan_tamu (nama) VALUES
  ('Teman SD'),
  ('Teman SMP'),
  ('Teman SMA'),
  ('Teman Kuliah'),
  ('Teman Kerja'),
  ('Tetangga'),
  ('Lainnya')
ON CONFLICT (nama) DO NOTHING;

-- ============================================
-- 6. INSERT DUMMY DATA - ROLES & USERS
-- ============================================

-- Insert default roles (Super Admin is set as default)
INSERT INTO roles (name, description, is_default) VALUES
  ('Super Admin', 'Full access to all features', true),
  ('Admin', 'Can manage guests and comments', false),
  ('Editor', 'Can edit content', false)
ON CONFLICT (name) DO NOTHING;

-- Insert default user (password: admin123 - dummy hash, should be bcrypt in production)
INSERT INTO users (username, password_hash, name) VALUES
  ('admin', 'admin123', 'Super Administrator')
ON CONFLICT (username) DO NOTHING;

-- Assign Super Admin role to default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Assign Admin role to default user (for testing role switching)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Assign Editor role to default user (for testing role switching)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'Editor'
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DEFAULT ROLE PERMISSIONS
-- ============================================

-- Super Admin: Full access (wildcard)
INSERT INTO role_permissions (role_id, url_pattern, description)
SELECT r.id, '*', 'Full access to all pages'
FROM roles r
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Admin: Access to main management pages
-- Admin: Access to main management pages
INSERT INTO role_permissions (role_id, url_pattern, description)
SELECT r.id, url, desc_text
FROM roles r,
(VALUES 
  ('/admin/dashboard', 'Access to Admin Dashboard'),
  ('/admin/pengaturan_pernikahan', 'Manage wedding settings'),
  ('/admin/tamu', 'Manage guests'),
  ('/admin/users', 'Manage users'),
  ('/admin/kategori_tamu', 'Manage guest categories'),
  ('/admin/hubungan_tamu', 'Manage guest relationships'),
  ('/admin/checkin', 'Guest check-in'),
  ('/admin/checkout', 'Guest check-out'),
  ('/admin/ucapan', 'Manage comments'),
  ('/admin/roles', 'Manage roles'),
  ('/admin/role_permissions', 'Manage permissions'),
  ('/personalisasi', 'Manage personalization')
) AS urls(url, desc_text)
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Editor: Limited access (only guest management)
INSERT INTO role_permissions (role_id, url_pattern, description)
SELECT r.id, '/admin/tamu', 'Manage guests only'
FROM roles r
WHERE r.name = 'Editor'
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. INSERT DUMMY DATA - TAMU TABLE
-- ============================================

WITH kategori AS (
  SELECT id, nama FROM kategori_tamu WHERE nama IN ('Tamu Hasri', 'Tamu Ramli', 'Tamu Ayah', 'Tamu Ibu')
),
hubungan AS (
  SELECT id, nama FROM hubungan_tamu WHERE nama IN ('Teman Kuliah', 'Teman Kerja', 'Tetangga', 'Teman SMA', 'Lainnya', 'Teman SD', 'Teman SMP')
)
INSERT INTO tamu (
  nama, 
  kategori_id, 
  hubungan_id, 
  alamat, 
  nomor_hp,
  username_instagram,
  qr_code, 
  konfirmasi_kehadiran
) VALUES
  -- Tamu Hasri
  (
    'Ahmad Fauzi',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Merdeka No. 123, Surabaya',
    '081234567890',
    'ahmadfauzi',
    '123456',
    'belum_konfirmasi'
  ),
  (
    'Eko Prasetyo',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SMA'),
    'Jl. Diponegoro No. 12, Yogyakarta',
    '085678901234',
    'ekoprasetyo',
    '567890',
    'belum_konfirmasi'
  ),
  (
    'Indah Permata',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Kemerdekaan No. 89, Jakarta',
    '089012345678',
    'indahpermata',
    '901234',
    'belum_konfirmasi'
  ),
  (
    'Maya Anggraini',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Pancasila No. 67, Malang',
    '084455667788',
    'mayaanggraini',
    '445566',
    'belum_konfirmasi'
  ),

  -- Tamu Ramli
  (
    'Siti Nurhaliza',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Sudirman No. 45, Jakarta',
    '082345678901',
    'sitinurhaliza',
    '234567',
    'belum_konfirmasi'
  ),
  (
    'Fitri Handayani',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SD'),
    'Jl. Pahlawan No. 56, Malang',
    '086789012345',
    'fitrihandayani',
    '678901',
    'belum_konfirmasi'
  ),
  (
    'Joko Widodo',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SMP'),
    'Jl. Proklamasi No. 101, Bandung',
    '081122334455',
    'jokowidodo',
    '112233',
    'belum_konfirmasi'
  ),
  (
    'Nugroho Adi',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Bhinneka No. 89, Solo',
    '085566778899',
    'nugrohoadi',
    '556677',
    'belum_konfirmasi'
  ),

  -- Tamu Ayah
  (
    'Budi Santoso',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Lainnya'),
    'Jl. Gatot Subroto No. 78, Bandung',
    '083456789012',
    'budisantoso',
    '345678',
    'belum_konfirmasi'
  ),
  (
    'Gunawan Wijaya',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Veteran No. 34, Solo',
    '087890123456',
    'gunawanwijaya',
    '789012',
    'belum_konfirmasi'
  ),
  (
    'Kartika Sari',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SMA'),
    'Jl. Indonesia Raya No. 23, Semarang',
    '082233445566',
    'kartikasari',
    '223344',
    'belum_konfirmasi'
  ),
  (
    'Olivia Tan',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Tunggal Ika No. 12, Surabaya',
    '086677889900',
    'oliviatan',
    '667788',
    'belum_konfirmasi'
  ),

  -- Tamu Ibu
  (
    'Dewi Lestari',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Ahmad Yani No. 90, Semarang',
    '084567890123',
    'dewilestari',
    '456789',
    'belum_konfirmasi'
  ),
  (
    'Hendra Kusuma',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Pemuda No. 67, Surabaya',
    '088901234567',
    'hendrakusuma',
    '890123',
    'belum_konfirmasi'
  ),
  (
    'Lukman Hakim',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Lainnya'),
    'Jl. Garuda No. 45, Yogyakarta',
    '083344556677',
    'lukmanhakim',
    '334455',
    'belum_konfirmasi'
  );

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Database structure:
-- - 7 tables: kategori_tamu, hubungan_tamu, tamu, roles, users, user_roles, ucapan
-- - Foreign key relations properly set up
-- - Default admin user created (username: admin, password: admin123)
-- - 15 sample tamu records
-- - Ready for use!
-- ============================================

