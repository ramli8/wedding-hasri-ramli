ALTER TABLE wedding_bank_accounts DROP COLUMN IF EXISTS image_url;
ALTER TABLE wedding_wishlist_items ADD COLUMN IF NOT EXISTS claimed_by_guest_id UUID DEFAULT NULL REFERENCES guests(id) ON DELETE SET NULL;
ALTER TABLE wedding_wishlist_items ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL;
DROP TABLE IF EXISTS wedding_wishlist_claims;
ALTER TABLE wedding_wishlist_items DROP COLUMN IF EXISTS stock_total;
ALTER TABLE wedding_story_events DROP COLUMN IF EXISTS detail;
