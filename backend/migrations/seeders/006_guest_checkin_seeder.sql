-- Seed guest check-in permission
INSERT INTO permissions (name, module, description) VALUES
('guests.check_in', 'guests', 'Check-in guests by QR code')
ON CONFLICT (name) DO NOTHING;

-- Assign to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' AND p.name = 'guests.check_in'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.name = 'guests.check_in'
ON CONFLICT (role_id, permission_id) DO NOTHING;
