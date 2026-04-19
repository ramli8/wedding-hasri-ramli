import type { User } from '@/src/domain/services/auth.service';
import type { Role, Permission, RoleWithPermissions, PermissionsByModule } from '@/src/domain/services/rbac.service';
import type { UserListResponse } from '@/src/domain/services/user.service';

// ========== Mock User (Logged In) ==========
export const MOCK_USER: User = {
  id: 'demo-user-001',
  email: 'admin@gns-demo.com',
  name: 'Demo Admin',
  avatar_url: '',
  is_oauth: false,
  is_active: true,
  email_verified: true,
  roles: ['Super Admin'],
  permissions: [
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'permissions.view', 'permissions.create', 'permissions.edit', 'permissions.delete',
    'settings.view', 'settings.edit',
  ],
  created_at: '2025-01-15T08:00:00Z',
};

// ========== Mock Permissions ==========
export const MOCK_PERMISSIONS: Permission[] = [
  { id: 1, name: 'users.view', module: 'users', description: 'View users list', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'users.create', module: 'users', description: 'Create new users', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'users.edit', module: 'users', description: 'Edit existing users', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 4, name: 'users.delete', module: 'users', description: 'Delete users', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 5, name: 'roles.view', module: 'roles', description: 'View roles', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 6, name: 'roles.create', module: 'roles', description: 'Create new roles', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 7, name: 'roles.edit', module: 'roles', description: 'Edit existing roles', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 8, name: 'roles.delete', module: 'roles', description: 'Delete roles', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 9, name: 'permissions.view', module: 'permissions', description: 'View permissions', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 10, name: 'permissions.create', module: 'permissions', description: 'Create permissions', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 11, name: 'permissions.edit', module: 'permissions', description: 'Edit permissions', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 12, name: 'permissions.delete', module: 'permissions', description: 'Delete permissions', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 13, name: 'settings.view', module: 'settings', description: 'View settings', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 14, name: 'settings.edit', module: 'settings', description: 'Edit settings', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
];

// ========== Mock Roles ==========
export const MOCK_ROLES: Role[] = [
  { id: 1, name: 'Super Admin', description: 'Full system access with all permissions', is_system: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Admin', description: 'Administrative access with most permissions', is_system: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Editor', description: 'Can view and edit content', is_system: false, created_at: '2025-02-10T00:00:00Z', updated_at: '2025-02-10T00:00:00Z' },
  { id: 4, name: 'Viewer', description: 'Read-only access to the system', is_system: false, created_at: '2025-03-05T00:00:00Z', updated_at: '2025-03-05T00:00:00Z' },
];

// ========== Mock Roles With Permissions ==========
export const MOCK_ROLES_WITH_PERMISSIONS: RoleWithPermissions[] = [
  { ...MOCK_ROLES[0], permissions: [...MOCK_PERMISSIONS] },
  { ...MOCK_ROLES[1], permissions: MOCK_PERMISSIONS.filter(p => [1,2,3,5,6,7,9,13,14].includes(p.id)) },
  { ...MOCK_ROLES[2], permissions: MOCK_PERMISSIONS.filter(p => [1,3,5,9,13].includes(p.id)) },
  { ...MOCK_ROLES[3], permissions: MOCK_PERMISSIONS.filter(p => [1,5,9,13].includes(p.id)) },
];

// ========== Mock Permissions By Module ==========
export const MOCK_PERMISSIONS_BY_MODULE: PermissionsByModule[] = [
  { module: 'users', permissions: MOCK_PERMISSIONS.filter(p => p.module === 'users') },
  { module: 'roles', permissions: MOCK_PERMISSIONS.filter(p => p.module === 'roles') },
  { module: 'permissions', permissions: MOCK_PERMISSIONS.filter(p => p.module === 'permissions') },
  { module: 'settings', permissions: MOCK_PERMISSIONS.filter(p => p.module === 'settings') },
];

// ========== Mock Users List ==========
export const MOCK_USERS: User[] = [
  MOCK_USER,
  {
    id: 'demo-user-002',
    email: 'budi@gns-demo.com',
    name: 'Budi Santoso',
    avatar_url: '',
    is_oauth: false,
    is_active: true,
    email_verified: true,
    roles: ['Admin'],
    permissions: ['users.view', 'users.create', 'users.edit', 'roles.view', 'settings.view'],
    created_at: '2025-02-20T10:30:00Z',
  },
  {
    id: 'demo-user-003',
    email: 'siti@gns-demo.com',
    name: 'Siti Rahayu',
    avatar_url: '',
    is_oauth: true,
    oauth_provider: 'google',
    is_active: true,
    email_verified: true,
    roles: ['Editor'],
    permissions: ['users.view', 'users.edit', 'settings.view'],
    created_at: '2025-03-01T14:00:00Z',
  },
  {
    id: 'demo-user-004',
    email: 'andi@gns-demo.com',
    name: 'Andi Wijaya',
    avatar_url: '',
    is_oauth: false,
    is_active: true,
    email_verified: true,
    roles: ['Viewer'],
    permissions: ['users.view', 'settings.view'],
    created_at: '2025-03-10T09:15:00Z',
  },
  {
    id: 'demo-user-005',
    email: 'dewi@gns-demo.com',
    name: 'Dewi Lestari',
    avatar_url: '',
    is_oauth: true,
    oauth_provider: 'google',
    is_active: false,
    email_verified: true,
    roles: ['Viewer'],
    permissions: ['users.view'],
    created_at: '2025-03-12T16:45:00Z',
  },
  {
    id: 'demo-user-006',
    email: 'rudi@gns-demo.com',
    name: 'Rudi Hartono',
    avatar_url: '',
    is_oauth: false,
    is_active: true,
    email_verified: false,
    roles: ['Editor'],
    permissions: ['users.view', 'users.edit'],
    created_at: '2025-03-15T11:20:00Z',
  },
];

// ========== Mock Deleted Users ==========
export const MOCK_DELETED_USERS: User[] = [
  {
    id: 'demo-user-del-001',
    email: 'former@gns-demo.com',
    name: 'Doni',
    avatar_url: '',
    is_oauth: false,
    is_active: false,
    email_verified: true,
    roles: ['Viewer'],
    permissions: [],
    created_at: '2025-01-20T08:00:00Z',
  },
  {
    id: 'demo-user-del-002',
    email: 'removed@gns-demo.com',
    name: 'Lisa',
    avatar_url: '',
    is_oauth: true,
    oauth_provider: 'google',
    is_active: false,
    email_verified: true,
    roles: [],
    permissions: [],
    created_at: '2025-02-05T12:00:00Z',
  },
];

// ========== Mock User List Response ==========
export function createMockUserListResponse(
  users: User[],
  page: number = 1,
  pageSize: number = 10
): UserListResponse {
  const start = (page - 1) * pageSize;
  const items = users.slice(start, start + pageSize);
  return {
    items,
    total: users.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(users.length / pageSize),
  };
}
