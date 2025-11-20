-- ============================================
-- Complete Database Schema for Wedding App
-- Tables and Relations Only (No Triggers/Policies)
-- Run this on fresh Supabase database
-- ============================================

-- ============================================
-- 1. CREATE MASTER TABLES
-- ============================================

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

-- ============================================
-- 2. CREATE MAIN TAMU TABLE
-- ============================================

-- Create tamu table with foreign keys to master tables
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

-- ============================================
-- 3. INSERT DUMMY DATA - MASTER TABLES
-- ============================================

-- Insert kategori_tamu dummy data
INSERT INTO kategori_tamu (nama) VALUES
  ('Tamu Hasri'),
  ('Tamu Ramli'),
  ('Tamu Ayah'),
  ('Tamu Ibu'),
  ('Tamu Keluarga Besar'),
  ('Tamu VIP')
ON CONFLICT (nama) DO NOTHING;

-- Insert hubungan_tamu dummy data
INSERT INTO hubungan_tamu (nama) VALUES
  ('Teman SD'),
  ('Teman SMP'),
  ('Teman SMA'),
  ('Teman Kuliah'),
  ('Teman Kerja'),
  ('Tetangga'),
  ('Saudara Kandung'),
  ('Saudara Sepupu'),
  ('Keponakan'),
  ('Paman/Bibi'),
  ('Kakek/Nenek'),
  ('Rekan Bisnis'),
  ('Lainnya')
ON CONFLICT (nama) DO NOTHING;

-- ============================================
-- 4. INSERT DUMMY DATA - TAMU TABLE
-- ============================================

-- Note: We need to get the IDs from master tables first
-- This uses a WITH clause to make it cleaner

WITH kategori AS (
  SELECT id, nama FROM kategori_tamu WHERE nama IN ('Tamu Hasri', 'Tamu Ramli', 'Tamu Ayah', 'Tamu Ibu')
),
hubungan AS (
  SELECT id, nama FROM hubungan_tamu WHERE nama IN ('Teman Kuliah', 'Teman Kerja', 'Saudara Kandung', 'Tetangga', 'Teman SMA', 'Saudara Sepupu')
)
INSERT INTO tamu (
  nama, 
  kategori_id, 
  hubungan_id, 
  alamat, 
  nomor_hp, 
  qr_code, 
  status_undangan, 
  konfirmasi_kehadiran,
  tgl_kirim_undangan,
  tgl_baca_undangan,
  tgl_mulai_resepsi,
  tgl_akhir_resepsi,
  check_in
) VALUES
  -- Tamu yang sudah hadir
  (
    'Ahmad Fauzi',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Merdeka No. 123, Surabaya',
    '081234567890',
    '123456',
    'dikirim',
    'akan_hadir',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'Siti Nurhaliza',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Sudirman No. 45, Jakarta',
    '082345678901',
    '234567',
    'dikirim',
    'akan_hadir',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '1 hour'
  ),
  (
    'Budi Santoso',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Saudara Kandung'),
    'Jl. Gatot Subroto No. 78, Bandung',
    '083456789012',
    '345678',
    'dikirim',
    'akan_hadir',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '3 hours'
  ),
  
  -- Tamu yang sudah konfirmasi hadir tapi belum check-in
  (
    'Dewi Lestari',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Ahmad Yani No. 90, Semarang',
    '084567890123',
    '456789',
    'dikirim',
    'akan_hadir',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Eko Prasetyo',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SMA'),
    'Jl. Diponegoro No. 12, Yogyakarta',
    '085678901234',
    '567890',
    'dikirim',
    'akan_hadir',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  
  -- Tamu yang tidak hadir
  (
    'Fitri Handayani',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Saudara Sepupu'),
    'Jl. Pahlawan No. 56, Malang',
    '086789012345',
    '678901',
    'dikirim',
    'tidak_hadir',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Gunawan Wijaya',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Veteran No. 34, Solo',
    '087890123456',
    '789012',
    'dikirim',
    'tidak_hadir',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  
  -- Tamu yang sudah baca undangan tapi belum konfirmasi
  (
    'Hendra Kusuma',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Pemuda No. 67, Surabaya',
    '088901234567',
    '890123',
    'dikirim',
    'belum_konfirmasi',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Indah Permata',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Kemerdekaan No. 89, Jakarta',
    '089012345678',
    '901234',
    'dikirim',
    'belum_konfirmasi',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  
  -- Tamu yang undangan sudah dikirim tapi belum dibaca
  (
    'Joko Widodo',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Saudara Kandung'),
    'Jl. Proklamasi No. 101, Bandung',
    '081122334455',
    '112233',
    'dikirim',
    'belum_konfirmasi',
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Kartika Sari',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman SMA'),
    'Jl. Indonesia Raya No. 23, Semarang',
    '082233445566',
    '223344',
    'dikirim',
    'belum_konfirmasi',
    NOW() - INTERVAL '1 day',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  
  -- Tamu yang undangan belum dikirim
  (
    'Lukman Hakim',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ibu'),
    (SELECT id FROM hubungan WHERE nama = 'Saudara Sepupu'),
    'Jl. Garuda No. 45, Yogyakarta',
    '083344556677',
    '334455',
    'belum_dikirim',
    'belum_konfirmasi',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Maya Anggraini',
    (SELECT id FROM kategori WHERE nama = 'Tamu Hasri'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kerja'),
    'Jl. Pancasila No. 67, Malang',
    '084455667788',
    '445566',
    'belum_dikirim',
    'belum_konfirmasi',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Nugroho Adi',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ramli'),
    (SELECT id FROM hubungan WHERE nama = 'Tetangga'),
    'Jl. Bhinneka No. 89, Solo',
    '085566778899',
    '556677',
    'belum_dikirim',
    'belum_konfirmasi',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  ),
  (
    'Olivia Tan',
    (SELECT id FROM kategori WHERE nama = 'Tamu Ayah'),
    (SELECT id FROM hubungan WHERE nama = 'Teman Kuliah'),
    'Jl. Tunggal Ika No. 12, Surabaya',
    '086677889900',
    '667788',
    'belum_dikirim',
    'belum_konfirmasi',
    NULL,
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '1 day',
    NULL
  );

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Database structure:
-- - 3 tables: kategori_tamu, hubungan_tamu, tamu
-- - Foreign key relations from tamu to master tables
-- - 6 kategori_tamu records
-- - 13 hubungan_tamu records
-- - 15 tamu records with various statuses
--
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Set up RLS policies manually if needed
-- 3. Set up triggers for updated_at if needed
-- 4. Start using the application
-- ============================================
