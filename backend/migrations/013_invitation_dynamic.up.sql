-- Konten dinamis lengkap + stok wishlist + aturan 1 tamu 1 klaim

-- Kisah: narasi panjang (beda dari description singkat)
ALTER TABLE wedding_story_events ADD COLUMN IF NOT EXISTS detail TEXT DEFAULT NULL;

-- Wishlist: stok per barang
ALTER TABLE wedding_wishlist_items ADD COLUMN IF NOT EXISTS stock_total INT NOT NULL DEFAULT 1;

-- Tabel klaim: 1 tamu hanya boleh 1 klaim total (UNIQUE guest_id)
CREATE TABLE IF NOT EXISTS wedding_wishlist_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES wedding_wishlist_items(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_wishlist_claim_per_guest UNIQUE (guest_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_claims_item ON wedding_wishlist_claims(item_id);

-- Migrasi klaim lama (kolom tunggal) ke tabel claims
INSERT INTO wedding_wishlist_claims (item_id, guest_id)
SELECT id, claimed_by_guest_id
FROM wedding_wishlist_items
WHERE claimed_by_guest_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE wedding_wishlist_items DROP COLUMN IF EXISTS claimed_by_guest_id;
ALTER TABLE wedding_wishlist_items DROP COLUMN IF EXISTS claimed_at;

-- Bank account: foto buku tabungan / logo (opsional)
ALTER TABLE wedding_bank_accounts ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
