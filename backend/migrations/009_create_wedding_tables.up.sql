-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE wedding_side AS ENUM ('pria', 'wanita');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rsvp_status AS ENUM ('hadir', 'tidak_hadir', 'ragu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create weddings table (singleton: exactly one row enforced by DB)
CREATE TABLE IF NOT EXISTS weddings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    groom_name VARCHAR(255) NOT NULL,
    bride_name VARCHAR(255) NOT NULL,
    wedding_date TIMESTAMPTZ DEFAULT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    gift_shipping_address TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create wedding_couples table
CREATE TABLE IF NOT EXISTS wedding_couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    side wedding_side NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    gelar VARCHAR(100) DEFAULT NULL,
    photo_url TEXT DEFAULT NULL,
    instagram_handle VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create wedding_events table
CREATE TABLE IF NOT EXISTS wedding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    event_date TIMESTAMPTZ DEFAULT NULL,
    start_time TIMESTAMPTZ DEFAULT NULL,
    venue_name VARCHAR(255) DEFAULT NULL,
    address_full TEXT DEFAULT NULL,
    gmaps_url TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    is_main_event BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wedding_events_order ON wedding_events(order_index);

-- Create wedding_story_events table
CREATE TABLE IF NOT EXISTS wedding_story_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date VARCHAR(50) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wedding_story_events_order ON wedding_story_events(order_index);

-- Create wedding_gallery_items table
CREATE TABLE IF NOT EXISTS wedding_gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    caption VARCHAR(500) DEFAULT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wedding_gallery_items_order ON wedding_gallery_items(order_index);

-- Create wedding_faqs table
CREATE TABLE IF NOT EXISTS wedding_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wedding_faqs_order ON wedding_faqs(order_index);

-- Create wedding_bank_accounts table
CREATE TABLE IF NOT EXISTS wedding_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create wedding_ewallets table
CREATE TABLE IF NOT EXISTS wedding_ewallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(100) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    qr_code_image_url TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create wedding_wishlist_items table
CREATE TABLE IF NOT EXISTS wedding_wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(255) NOT NULL,
    item_image_url TEXT DEFAULT NULL,
    item_link TEXT DEFAULT NULL,
    claimed_by_guest_id UUID DEFAULT NULL REFERENCES guests(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wedding_wishlist_items_claimed_by ON wedding_wishlist_items(claimed_by_guest_id);

-- Create invitation_sections table
CREATE TABLE IF NOT EXISTS invitation_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create rsvp_submissions table
CREATE TABLE IF NOT EXISTS rsvp_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    wedding_event_id UUID DEFAULT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
    attendance_status rsvp_status NOT NULL,
    number_of_guests INTEGER NOT NULL DEFAULT 1,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rsvp_submissions_guest_id ON rsvp_submissions(guest_id);
CREATE UNIQUE INDEX idx_rsvp_guest_event ON rsvp_submissions(
    guest_id,
    COALESCE(wedding_event_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Create guestbook_entries table
CREATE TABLE IF NOT EXISTS guestbook_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID DEFAULT NULL REFERENCES guests(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    reply_text TEXT DEFAULT NULL,
    replied_at TIMESTAMPTZ DEFAULT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guestbook_entries_is_hidden ON guestbook_entries(is_hidden);
CREATE INDEX idx_guestbook_entries_created_at ON guestbook_entries(created_at);

-- Create guest_photos table
CREATE TABLE IF NOT EXISTS guest_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID DEFAULT NULL REFERENCES guests(id) ON DELETE SET NULL,
    guest_name VARCHAR(255) NOT NULL,
    photo_url TEXT NOT NULL,
    caption VARCHAR(500) DEFAULT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_photos_is_hidden ON guest_photos(is_hidden);
CREATE INDEX idx_guest_photos_created_at ON guest_photos(created_at);
