-- Seed guest permissions
INSERT INTO permissions (name, module, description) VALUES
('guests.read', 'guests', 'View guests'),
('guests.create', 'guests', 'Create new guests'),
('guests.update', 'guests', 'Update guest information'),
('guests.delete', 'guests', 'Delete guests'),
('guests.send_message', 'guests', 'Send messages to guests')
ON CONFLICT (name) DO NOTHING;

-- Assign to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' AND p.module = 'guests'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.module = 'guests'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Set up module access for Super Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'guests', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Super Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Set up module access for Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'guests', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Seed guest categories if not exists (for dummy guests)
INSERT INTO guest_categories (name) VALUES
('Regular'), ('VIP'), ('Family')
ON CONFLICT (name) DO NOTHING;

-- Seed dummy guests
INSERT INTO guests (guest_category_id, qr_code, name, phone_number, instagram_username, status_attending, status_sent) VALUES
((SELECT id FROM guest_categories WHERE name = 'Regular' LIMIT 1), 'ABCDEF', 'John Doe', '628123456789', 'johndoe', 'pending', 'pending'),
((SELECT id FROM guest_categories WHERE name = 'VIP' LIMIT 1), 'GHIJKL', 'Jane Smith', '628987654321', 'janesmith', 'going', 'sent'),
((SELECT id FROM guest_categories WHERE name = 'Family' LIMIT 1), 'MNOPQR', 'Bob Wilson', '628112233445', 'bobwilson', 'not_going', 'pending')
ON CONFLICT (qr_code) DO NOTHING;
