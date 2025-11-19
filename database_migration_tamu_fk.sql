-- Migration script to update existing tamu table to use foreign keys
-- Run this AFTER creating kategori_tamu and hubungan_tamu tables

-- Step 1: Add new columns for foreign keys
ALTER TABLE tamu ADD COLUMN IF NOT EXISTS kategori_id UUID;
ALTER TABLE tamu ADD COLUMN IF NOT EXISTS hubungan_id UUID;

-- Step 2: Migrate existing data
-- Map kategori string to kategori_id
UPDATE tamu t
SET kategori_id = kt.id
FROM kategori_tamu kt
WHERE t.kategori = kt.nama;

-- Map hubungan string to hubungan_id
UPDATE tamu t
SET hubungan_id = ht.id
FROM hubungan_tamu ht
WHERE t.hubungan = ht.nama;

-- Step 3: Make foreign key columns NOT NULL (after data migration)
ALTER TABLE tamu ALTER COLUMN kategori_id SET NOT NULL;
ALTER TABLE tamu ALTER COLUMN hubungan_id SET NOT NULL;

-- Step 4: Add foreign key constraints
ALTER TABLE tamu 
  ADD CONSTRAINT fk_tamu_kategori 
  FOREIGN KEY (kategori_id) 
  REFERENCES kategori_tamu(id);

ALTER TABLE tamu 
  ADD CONSTRAINT fk_tamu_hubungan 
  FOREIGN KEY (hubungan_id) 
  REFERENCES hubungan_tamu(id);

-- Step 5: Drop old columns (optional, keep for backward compatibility if needed)
-- ALTER TABLE tamu DROP COLUMN IF EXISTS kategori;
-- ALTER TABLE tamu DROP COLUMN IF EXISTS hubungan;

-- Note: If you want to keep old columns for backward compatibility,
-- you can create triggers to sync between old and new columns
