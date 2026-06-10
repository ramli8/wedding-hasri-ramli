-- Seed vendor permissions
INSERT INTO permissions (name, module, description) VALUES
('vendors.categories.read', 'vendors', 'View vendor categories'),
('vendors.categories.create', 'vendors', 'Create vendor categories'),
('vendors.categories.update', 'vendors', 'Update vendor categories'),
('vendors.categories.delete', 'vendors', 'Delete vendor categories'),
('vendors.attributes.read', 'vendors', 'View category attributes'),
('vendors.attributes.create', 'vendors', 'Create category attributes'),
('vendors.attributes.update', 'vendors', 'Update category attributes'),
('vendors.attributes.delete', 'vendors', 'Delete category attributes'),
('vendors.read', 'vendors', 'View vendors'),
('vendors.create', 'vendors', 'Create new vendors'),
('vendors.update', 'vendors', 'Update vendor information'),
('vendors.delete', 'vendors', 'Delete vendors'),
('vendors.payments.read', 'vendors', 'View vendor payments'),
('vendors.payments.create', 'vendors', 'Create vendor payments'),
('vendors.payments.update', 'vendors', 'Update vendor payments'),
('vendors.payments.delete', 'vendors', 'Delete vendor payments')
ON CONFLICT (name) DO NOTHING;

-- Assign to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' AND p.module = 'vendors'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.module = 'vendors'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Set up module access for Super Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'vendors', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Super Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Set up module access for Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'vendors', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Seed dummy vendor categories (assuming event_id = '00000000-0000-0000-0000-000000000001')
INSERT INTO vendor_categories (event_id, name) VALUES
('00000000-0000-0000-0000-000000000001', 'Fotografer'),
('00000000-0000-0000-0000-000000000001', 'Catering'),
('00000000-0000-0000-0000-000000000001', 'Venue'),
('00000000-0000-0000-0000-000000000001', 'MUA')
ON CONFLICT (event_id, name) DO NOTHING;

-- Seed attributes for Fotografer
INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Harga', 1 FROM vendor_categories WHERE name = 'Fotografer' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Jumlah Fotografer', 2 FROM vendor_categories WHERE name = 'Fotografer' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Include Album', 3 FROM vendor_categories WHERE name = 'Fotografer' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Durasi Jam', 4 FROM vendor_categories WHERE name = 'Fotografer' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Include Video', 5 FROM vendor_categories WHERE name = 'Fotografer' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed attributes for Catering
INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Harga per Pax', 1 FROM vendor_categories WHERE name = 'Catering' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Menu Makanan', 2 FROM vendor_categories WHERE name = 'Catering' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Minuman', 3 FROM vendor_categories WHERE name = 'Catering' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Kapasitas', 4 FROM vendor_categories WHERE name = 'Catering' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed attributes for Venue
INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Harga', 1 FROM vendor_categories WHERE name = 'Venue' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Kapasitas', 2 FROM vendor_categories WHERE name = 'Venue' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Lokasi', 3 FROM vendor_categories WHERE name = 'Venue' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Indoor/Outdoor', 4 FROM vendor_categories WHERE name = 'Venue' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Include Dekorasi', 5 FROM vendor_categories WHERE name = 'Venue' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed attributes for MUA
INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Harga', 1 FROM vendor_categories WHERE name = 'MUA' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Tipe Makeup', 2 FROM vendor_categories WHERE name = 'MUA' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO vendor_category_attributes (category_id, name, sort_order)
SELECT id, 'Include Hairdo', 3 FROM vendor_categories WHERE name = 'MUA' AND event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (category_id, name) DO NOTHING;

-- Seed dummy vendors for Fotografer
INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Lensa Cinta Photography', 'Andi Pratama', '628111111111', 'lensacinta', 'Jl. Merdeka No. 10, Jakarta', 5000000, 4500000, 'paid', 'Sudah include album cetak'
FROM vendor_categories vc WHERE vc.name = 'Fotografer' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Momen Abadi', 'Siti Rahma', '628222222222', 'momenabadi', 'Jl. Sudirman No. 25, Bandung', 4000000, 4000000, 'partial', 'Masih negosisasi'
FROM vendor_categories vc WHERE vc.name = 'Fotografer' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Golden Shutter', 'Budi Santoso', '628333333333', 'goldenshutter', 'Jl. Gatot Subroto No. 5, Jakarta', 6000000, NULL, 'unpaid', 'Belum deal harga'
FROM vendor_categories vc WHERE vc.name = 'Fotografer' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Seed dummy vendors for Catering
INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Rasa Nusantara Catering', 'Dewi Lestari', '628444444444', 'rasanusantara', 'Jl. Diponegoro No. 15, Jakarta', 30000000, 28000000, 'unpaid', 'Menu prasmanan'
FROM vendor_categories vc WHERE vc.name = 'Catering' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Lezat Raya Catering', 'Ahmad Faizal', '628555555555', 'lezatraya', 'Jl. Thamrin No. 8, Jakarta', 35000000, NULL, 'unpaid', 'Menunggu keputusan'
FROM vendor_categories vc WHERE vc.name = 'Catering' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Seed dummy vendors for Venue
INSERT INTO vendors (category_id, name, contact_person, phone_number, instagram, address, reference_price, contract_amount, payment_status, note)
SELECT vc.id, 'Grand Ballroom Hotel Indonesia', 'Rina Mariana', '628666666666', 'grandballroom', 'Jl. MH Thamrin No. 1, Jakarta', 75000000, 70000000, 'paid', 'Include dekorasi dan sound system'
FROM vendor_categories vc WHERE vc.name = 'Venue' AND vc.event_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Set selected vendor for Fotografer = Lensa Cinta Photography
UPDATE vendor_categories vc
SET selected_vendor_id = v.id
FROM vendors v
WHERE v.name = 'Lensa Cinta Photography'
  AND vc.name = 'Fotografer'
  AND vc.event_id = '00000000-0000-0000-0000-000000000001';

-- Set selected vendor for Venue = Grand Ballroom Hotel Indonesia
UPDATE vendor_categories vc
SET selected_vendor_id = v.id
FROM vendors v
WHERE v.name = 'Grand Ballroom Hotel Indonesia'
  AND vc.name = 'Venue'
  AND vc.event_id = '00000000-0000-0000-0000-000000000001';

-- Seed attribute values for Lensa Cinta Photography
INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Rp 4.500.000'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Harga'
WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '2 Fotografer'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Jumlah Fotografer'
WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Album'
WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '12 Jam'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Durasi Jam'
WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Tidak Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Video'
WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

-- Seed attribute values for Momen Abadi
INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Rp 4.000.000'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Harga'
WHERE v.name = 'Momen Abadi'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '1 Fotografer'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Jumlah Fotografer'
WHERE v.name = 'Momen Abadi'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Tidak Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Album'
WHERE v.name = 'Momen Abadi'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '10 Jam'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Durasi Jam'
WHERE v.name = 'Momen Abadi'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Video'
WHERE v.name = 'Momen Abadi'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

-- Seed attribute values for Golden Shutter
INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Rp 6.000.000'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Harga'
WHERE v.name = 'Golden Shutter'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '3 Fotografer'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Jumlah Fotografer'
WHERE v.name = 'Golden Shutter'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Album'
WHERE v.name = 'Golden Shutter'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, '10 Jam'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Durasi Jam'
WHERE v.name = 'Golden Shutter'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

INSERT INTO vendor_attribute_values (vendor_id, attribute_id, value)
SELECT v.id, vca.id, 'Include'
FROM vendors v
JOIN vendor_category_attributes vca ON vca.category_id = v.category_id AND vca.name = 'Include Video'
WHERE v.name = 'Golden Shutter'
ON CONFLICT (vendor_id, attribute_id) DO NOTHING;

-- Seed payments for Lensa Cinta Photography (selected & paid)
INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-05-01', 2000000, 'DP 1 - Down Payment'
FROM vendors v WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT DO NOTHING;

INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-05-15', 1500000, 'DP 2 - Pelunasan sebagian'
FROM vendors v WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT DO NOTHING;

INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-06-01', 1000000, 'Pelunasan'
FROM vendors v WHERE v.name = 'Lensa Cinta Photography'
ON CONFLICT DO NOTHING;

-- Seed payments for Momen Abadi (partial)
INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-05-20', 1500000, 'DP'
FROM vendors v WHERE v.name = 'Momen Abadi'
ON CONFLICT DO NOTHING;

-- Seed payments for Grand Ballroom Hotel Indonesia (paid)
INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-04-01', 30000000, 'DP 1'
FROM vendors v WHERE v.name = 'Grand Ballroom Hotel Indonesia'
ON CONFLICT DO NOTHING;

INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-05-01', 25000000, 'DP 2'
FROM vendors v WHERE v.name = 'Grand Ballroom Hotel Indonesia'
ON CONFLICT DO NOTHING;

INSERT INTO vendor_payments (vendor_id, date, amount, note)
SELECT v.id, '2026-05-20', 15000000, 'Pelunasan'
FROM vendors v WHERE v.name = 'Grand Ballroom Hotel Indonesia'
ON CONFLICT DO NOTHING;
