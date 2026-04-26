-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE guest_status_attending AS ENUM ('pending', 'going', 'not_going');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE guest_status_sent AS ENUM ('pending', 'sent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_category_id INTEGER NOT NULL REFERENCES guest_categories(id) ON DELETE CASCADE,
    qr_code VARCHAR(6) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    instagram_username VARCHAR(50) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    note TEXT DEFAULT NULL,
    status_attending guest_status_attending DEFAULT 'pending',
    status_sent guest_status_sent DEFAULT 'pending',
    check_in_at TIMESTAMP DEFAULT NULL,
    check_out_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL
);

-- Create indexes
CREATE INDEX idx_guests_category_id ON guests(guest_category_id);
CREATE INDEX idx_guests_qr_code ON guests(qr_code);
CREATE INDEX idx_guests_status_attending ON guests(status_attending);
CREATE INDEX idx_guests_status_sent ON guests(status_sent);
CREATE INDEX idx_guests_deleted_at ON guests(deleted_at);
