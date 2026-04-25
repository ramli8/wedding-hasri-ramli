-- Seed guest categories permissions
INSERT INTO permissions (name, module, description) VALUES
('guest_categories.read', 'guest_categories', 'View guest categories'),
('guest_categories.create', 'guest_categories', 'Create new guest categories'),
('guest_categories.update', 'guest_categories', 'Update guest category information'),
('guest_categories.delete', 'guest_categories', 'Delete guest categories')
ON CONFLICT (name) DO NOTHING;

-- Assign to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' AND p.module = 'guest_categories'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.module = 'guest_categories'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Set up module access for Super Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'guest_categories', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Super Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;

-- Set up module access for Admin
INSERT INTO module_access (role_id, module_name, can_view, can_create, can_edit, can_delete)
SELECT id, 'guest_categories', TRUE, TRUE, TRUE, TRUE
FROM roles WHERE name = 'Admin'
ON CONFLICT (role_id, module_name) DO NOTHING;
