import supabase from '@/lib/supabaseClient';

export interface RolePermission {
  id: string;
  role_id: string;
  url_pattern: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PermissionCheck {
  hasAccess: boolean;
  reason?: string;
}

class PermissionAPI {
  public supabase = supabase; // Expose supabase for external use

  /**
   * Get all active permissions for a specific role
   */
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .is('deleted_at', null)
      .order('url_pattern');

    if (error) throw error;
    return data as RolePermission[];
  }

  /**
   * Update permissions for a role (handling soft deletes)
   */
  async updateRolePermissions(roleId: string, urlPatterns: string[]): Promise<void> {
    // 1. Get all existing permissions for this role (including deleted ones)
    const { data: existingPermissions, error: fetchError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId);

    if (fetchError) throw fetchError;

    const existingMap = new Map(existingPermissions?.map(p => [p.url_pattern, p]));
    const newSet = new Set(urlPatterns);

    // 2. Identify permissions to soft delete (exist in DB, active, but not in new list)
    const toSoftDelete = existingPermissions?.filter(
      p => !p.deleted_at && !newSet.has(p.url_pattern)
    ).map(p => p.id) || [];

    // 3. Identify permissions to restore (exist in DB, deleted, but in new list)
    const toRestore = existingPermissions?.filter(
      p => p.deleted_at && newSet.has(p.url_pattern)
    ).map(p => p.id) || [];

    // 4. Identify permissions to insert (don't exist in DB)
    const toInsert = urlPatterns.filter(url => !existingMap.has(url)).map(url => ({
      role_id: roleId,
      url_pattern: url,
    }));

    // Execute updates
    if (toSoftDelete.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in('id', toSoftDelete);
      if (error) throw error;
    }

    if (toRestore.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .in('id', toRestore);
      if (error) throw error;
    }

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .insert(toInsert);
      if (error) throw error;
    }
  }

  /**
   * Check if a role has access to a specific URL
   */
  async checkAccess(roleId: string, url: string): Promise<PermissionCheck> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('url_pattern')
      .eq('role_id', roleId)
      .is('deleted_at', null);

    if (error) {
      return { hasAccess: false, reason: 'Error checking permissions' };
    }

    if (!data || data.length === 0) {
      return { hasAccess: false, reason: 'No permissions assigned to this role' };
    }

    // Check for wildcard (full access)
    const hasWildcard = data.some(p => p.url_pattern === '*');
    if (hasWildcard) {
      return { hasAccess: true };
    }

    // Check for exact match or pattern match
    const hasMatch = data.some(p => {
      const pattern = p.url_pattern;
      
      // Exact match
      if (pattern === url) return true;
      
      // Wildcard pattern (e.g., /admin/*)
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return url.startsWith(prefix);
      }
      
      return false;
    });

    if (hasMatch) {
      return { hasAccess: true };
    }

    return { hasAccess: false, reason: 'URL not in allowed permissions' };
  }

  /**
   * Get all permissions (for admin view)
   */
  async getAllPermissions(): Promise<(RolePermission & { roles: { name: string } })[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*, roles(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (RolePermission & { roles: { name: string } })[];
  }

  /**
   * Soft delete a permission
   */
  async deletePermission(id: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Restore a soft-deleted permission
   */
  async restorePermission(id: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Create a new permission
   */
  async createPermission(permission: Omit<RolePermission, 'id' | 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .insert(permission);

    if (error) throw error;
  }

  /**
   * Update an existing permission
   */
  async updatePermission(id: string, updates: Partial<RolePermission>): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get all available URL patterns (for UI selection)
   */
  getAvailableUrls(): Array<{ url: string; label: string }> {
    return [
      { url: '*', label: 'Full Access (All Pages)' },
      { url: '/admin/dashboard', label: 'Dashboard' },
      { url: '/admin/tamu', label: 'Guest Management' },
      { url: '/admin/kategori_tamu', label: 'Guest Categories' },
      { url: '/admin/hubungan_tamu', label: 'Guest Relationships' },
      { url: '/admin/checkin', label: 'Check-In' },
      { url: '/admin/checkout', label: 'Check-Out' },
      { url: '/admin/ucapan', label: 'Comments Management' },
      { url: '/admin/users', label: 'User Management' },
      { url: '/admin/roles', label: 'Role Management' },
      { url: '/admin/role_permissions', label: 'Permission Management' },
    ];
  }
}

export default PermissionAPI;
