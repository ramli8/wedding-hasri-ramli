-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE vendor_payment_status AS ENUM ('unpaid', 'partial', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create vendor_categories table (without FK to vendors first, circular dependency)
CREATE TABLE IF NOT EXISTS vendor_categories (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    selected_vendor_id UUID DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vendor_categories_event_name ON vendor_categories(event_id, name);
CREATE INDEX idx_vendor_categories_event_id ON vendor_categories(event_id);

-- Create vendor_category_attributes table
CREATE TABLE IF NOT EXISTS vendor_category_attributes (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES vendor_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vcat_attrs_category_name ON vendor_category_attributes(category_id, name);
CREATE INDEX idx_vcat_attrs_category_id ON vendor_category_attributes(category_id);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER NOT NULL REFERENCES vendor_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) DEFAULT NULL,
    phone_number VARCHAR(20) DEFAULT NULL,
    instagram VARCHAR(50) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    reference_price DECIMAL(15,2) DEFAULT NULL,
    contract_amount DECIMAL(15,2) DEFAULT NULL,
    payment_status vendor_payment_status DEFAULT 'unpaid',
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX idx_vendors_category_id ON vendors(category_id);
CREATE INDEX idx_vendors_deleted_at ON vendors(deleted_at);

-- Add FK from vendor_categories.selected_vendor_id to vendors.id
ALTER TABLE vendor_categories
    ADD CONSTRAINT fk_vendor_categories_selected_vendor
    FOREIGN KEY (selected_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Create vendor_attribute_values table
CREATE TABLE IF NOT EXISTS vendor_attribute_values (
    id SERIAL PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    attribute_id INTEGER NOT NULL REFERENCES vendor_category_attributes(id) ON DELETE CASCADE,
    value TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vattr_values_vendor_attribute ON vendor_attribute_values(vendor_id, attribute_id);
CREATE INDEX idx_vattr_values_vendor_id ON vendor_attribute_values(vendor_id);
CREATE INDEX idx_vattr_values_attribute_id ON vendor_attribute_values(attribute_id);

-- Create vendor_payments table
CREATE TABLE IF NOT EXISTS vendor_payments (
    id SERIAL PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendor_payments_vendor_id ON vendor_payments(vendor_id);
