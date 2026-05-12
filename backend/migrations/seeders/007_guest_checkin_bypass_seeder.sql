-- Seed guest bypass check-in permission
INSERT INTO permissions (name, module, description) VALUES
('guests.bypass_checkin', 'guests', 'Bypass check-in guests by ID without QR code')
ON CONFLICT (name) DO NOTHING;

-- Assign to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' AND p.name = 'guests.bypass_checkin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.name = 'guests.bypass_checkin'
ON CONFLICT (role_id, permission_id) DO NOTHING;
