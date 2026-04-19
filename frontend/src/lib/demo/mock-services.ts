import type { AuthResponse, LoginRequest, RegisterRequest, GoogleOAuthRequest, RefreshTokenRequest, UpdateProfileRequest, ChangePasswordRequest, ProfileResponse, User } from '@/src/domain/services/auth.service';
import type { UserListParams, UserListResponse, CreateUserRequest, UpdateUserRequest } from '@/src/domain/services/user.service';
import type { Role, RoleWithPermissions, Permission, PermissionsByModule, CreateRoleRequest, UpdateRoleRequest, CreatePermissionRequest, UpdatePermissionRequest, AssignPermissionsRequest, AssignRolesRequest, UpdateModuleAccessRequest, ModuleAccess } from '@/src/domain/services/rbac.service';
import { MOCK_USER, MOCK_USERS, MOCK_DELETED_USERS, MOCK_ROLES, MOCK_PERMISSIONS, MOCK_ROLES_WITH_PERMISSIONS, MOCK_PERMISSIONS_BY_MODULE, createMockUserListResponse } from './mock-data';

/** Simulate API delay */
const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

/** In-memory state for demo CRUD operations */
let demoUsers = [...MOCK_USERS];
let demoDeletedUsers = [...MOCK_DELETED_USERS];
let demoRoles = [...MOCK_ROLES];
let demoPermissions = [...MOCK_PERMISSIONS];
let demoRolesWithPermissions = [...MOCK_ROLES_WITH_PERMISSIONS];
let nextUserId = 100;
let nextRoleId = 100;
let nextPermissionId = 100;

/** Reset all demo data to initial state */
export function resetDemoData() {
  demoUsers = [...MOCK_USERS];
  demoDeletedUsers = [...MOCK_DELETED_USERS];
  demoRoles = [...MOCK_ROLES];
  demoPermissions = [...MOCK_PERMISSIONS];
  demoRolesWithPermissions = [...MOCK_ROLES_WITH_PERMISSIONS];
  nextUserId = 100;
  nextRoleId = 100;
  nextPermissionId = 100;
}

// ========== Mock Auth Service ==========
export const mockAuthService = {
  async login(_data: LoginRequest): Promise<AuthResponse> {
    await delay(500);
    return {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      user: MOCK_USER,
    };
  },

  async register(_data: RegisterRequest): Promise<AuthResponse> {
    await delay(500);
    return {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      user: { ...MOCK_USER, name: _data.name, email: _data.email },
    };
  },

  async loginWithGoogle(_data: GoogleOAuthRequest): Promise<AuthResponse> {
    await delay(500);
    return {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      user: { ...MOCK_USER, is_oauth: true, oauth_provider: 'google' },
    };
  },

  async refreshToken(_data: RefreshTokenRequest): Promise<AuthResponse> {
    await delay(200);
    return {
      access_token: 'demo-access-token-refreshed',
      refresh_token: 'demo-refresh-token-refreshed',
      expires_in: 3600,
      user: MOCK_USER,
    };
  },

  async logout(): Promise<void> {
    await delay(200);
  },

  async getProfile(): Promise<ProfileResponse> {
    await delay(300);
    return { user: MOCK_USER };
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    await delay(400);
    return { ...MOCK_USER, ...data };
  },

  async changePassword(_data: ChangePasswordRequest): Promise<void> {
    await delay(400);
  },
};

// ========== Mock User Service ==========
export const mockUserService = {
  async listUsers(params: UserListParams = {}): Promise<UserListResponse> {
    await delay(400);
    let filtered = [...demoUsers];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    if (params.is_active !== undefined) {
      filtered = filtered.filter(u => u.is_active === params.is_active);
    }

    if (params.sort_by) {
      filtered.sort((a, b) => {
        const aVal = (a as any)[params.sort_by!] ?? '';
        const bVal = (b as any)[params.sort_by!] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return params.sort_dir === 'desc' ? -cmp : cmp;
      });
    }

    return createMockUserListResponse(filtered, params.page || 1, params.page_size || 10);
  },

  async getUser(id: string): Promise<User> {
    await delay(300);
    const user = demoUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    await delay(500);
    const newUser: User = {
      id: `demo-user-${nextUserId++}`,
      email: data.email,
      name: data.name,
      avatar_url: '',
      is_oauth: false,
      is_active: true,
      email_verified: false,
      roles: data.role_ids
        ? data.role_ids.map(id => demoRoles.find(r => r.id === id)?.name || 'Unknown').filter(Boolean)
        : [],
      permissions: [],
      created_at: new Date().toISOString(),
    };
    demoUsers = [newUser, ...demoUsers];
    return newUser;
  },

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    await delay(400);
    const idx = demoUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    const updated = {
      ...demoUsers[idx],
      ...data,
      roles: data.role_ids
        ? data.role_ids.map(rid => demoRoles.find(r => r.id === rid)?.name || 'Unknown')
        : demoUsers[idx].roles,
    };
    demoUsers[idx] = updated;
    demoUsers = [...demoUsers];
    return updated;
  },

  async deleteUser(id: string): Promise<void> {
    await delay(400);
    const user = demoUsers.find(u => u.id === id);
    if (user) {
      demoDeletedUsers = [{ ...user, is_active: false }, ...demoDeletedUsers];
      demoUsers = demoUsers.filter(u => u.id !== id);
    }
  },

  async toggleUserStatus(id: string): Promise<User> {
    await delay(300);
    const idx = demoUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    demoUsers[idx] = { ...demoUsers[idx], is_active: !demoUsers[idx].is_active };
    demoUsers = [...demoUsers];
    return demoUsers[idx];
  },

  async listDeletedUsers(params: UserListParams = {}): Promise<UserListResponse> {
    await delay(400);
    let filtered = [...demoDeletedUsers];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    return createMockUserListResponse(filtered, params.page || 1, params.page_size || 10);
  },

  async restoreUser(id: string): Promise<User> {
    await delay(400);
    const user = demoDeletedUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    const restored = { ...user, is_active: true };
    demoDeletedUsers = demoDeletedUsers.filter(u => u.id !== id);
    demoUsers = [restored, ...demoUsers];
    return restored;
  },
};

// ========== Mock RBAC Service ==========
export const mockRbacService = {
  async getAllRoles(): Promise<Role[]> {
    await delay(300);
    return [...demoRoles];
  },

  async getRoleById(id: number): Promise<RoleWithPermissions> {
    await delay(300);
    const role = demoRolesWithPermissions.find(r => r.id === id);
    if (!role) {
      const basicRole = demoRoles.find(r => r.id === id);
      if (!basicRole) throw new Error('Role not found');
      return { ...basicRole, permissions: [] };
    }
    return { ...role };
  },

  async createRole(data: CreateRoleRequest): Promise<Role> {
    await delay(400);
    const newRole: Role = {
      id: nextRoleId++,
      name: data.name,
      description: data.description,
      is_system: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoRoles = [...demoRoles, newRole];
    demoRolesWithPermissions = [...demoRolesWithPermissions, { ...newRole, permissions: [] }];
    return newRole;
  },

  async updateRole(id: number, data: UpdateRoleRequest): Promise<Role> {
    await delay(400);
    const idx = demoRoles.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Role not found');
    demoRoles[idx] = { ...demoRoles[idx], ...data, updated_at: new Date().toISOString() };
    demoRoles = [...demoRoles];
    return demoRoles[idx];
  },

  async deleteRole(id: number): Promise<void> {
    await delay(400);
    demoRoles = demoRoles.filter(r => r.id !== id);
    demoRolesWithPermissions = demoRolesWithPermissions.filter(r => r.id !== id);
  },

  async getAllPermissions(): Promise<Permission[]> {
    await delay(300);
    return [...demoPermissions];
  },

  async getPermissionsByModule(): Promise<PermissionsByModule[]> {
    await delay(300);
    return [...MOCK_PERMISSIONS_BY_MODULE];
  },

  async getPermissionById(id: number): Promise<Permission> {
    await delay(200);
    const perm = demoPermissions.find(p => p.id === id);
    if (!perm) throw new Error('Permission not found');
    return perm;
  },

  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    await delay(400);
    const newPerm: Permission = {
      id: nextPermissionId++,
      name: data.name,
      module: data.module,
      description: data.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoPermissions = [...demoPermissions, newPerm];
    return newPerm;
  },

  async updatePermission(id: number, data: UpdatePermissionRequest): Promise<Permission> {
    await delay(400);
    const idx = demoPermissions.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Permission not found');
    demoPermissions[idx] = { ...demoPermissions[idx], ...data, updated_at: new Date().toISOString() };
    demoPermissions = [...demoPermissions];
    return demoPermissions[idx];
  },

  async deletePermission(id: number): Promise<void> {
    await delay(400);
    demoPermissions = demoPermissions.filter(p => p.id !== id);
  },

  async assignPermissionsToRole(roleId: number, data: AssignPermissionsRequest): Promise<void> {
    await delay(400);
    const idx = demoRolesWithPermissions.findIndex(r => r.id === roleId);
    if (idx !== -1) {
      const perms = demoPermissions.filter(p => data.permission_ids.includes(p.id));
      demoRolesWithPermissions[idx] = { ...demoRolesWithPermissions[idx], permissions: perms };
      demoRolesWithPermissions = [...demoRolesWithPermissions];
    }
  },

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    await delay(300);
    const role = demoRolesWithPermissions.find(r => r.id === roleId);
    return role?.permissions || [];
  },

  async assignRolesToUser(_userId: string, _data: AssignRolesRequest): Promise<void> {
    await delay(400);
  },

  async getUserRoles(_userId: string): Promise<Role[]> {
    await delay(300);
    return [demoRoles[0]];
  },

  async updateModuleAccess(_roleId: number, data: UpdateModuleAccessRequest): Promise<ModuleAccess> {
    await delay(400);
    return {
      id: 1,
      role_id: _roleId,
      module_name: data.module_name,
      can_view: data.can_view,
      can_create: data.can_create,
      can_edit: data.can_edit,
      can_delete: data.can_delete,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async getModuleAccessByRole(_roleId: number): Promise<ModuleAccess[]> {
    await delay(300);
    return [];
  },

  async checkPermission(_permission: string): Promise<boolean> {
    await delay(100);
    return true;
  },

  async checkModuleAccess(_module: string, _action: 'view' | 'create' | 'edit' | 'delete'): Promise<boolean> {
    await delay(100);
    return true;
  },
};
