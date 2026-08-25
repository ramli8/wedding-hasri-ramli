ALTER TABLE wedding_ewallets ADD COLUMN is_qris BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE wedding_ewallets SET is_qris = TRUE WHERE lower(provider_name) = 'qris';
