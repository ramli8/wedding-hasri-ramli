import supabase from '@/lib/supabaseClient';

export interface Role {
  id: string;
  name: string;
  description: string;
  deleted_at?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roles?: Role[];
  deleted_at?: string;
}

export interface CreateUserInput {
  username: string;
  name: string;
  password_hash: string; // Plain text for now, handled by DB or simple logic
  role_ids: string[];
}

export interface UserApiResponse {
  data: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class UserAPI {
  async getUsers(
    page?: number,
    limit?: number,
    filters?: {
      status?: 'all' | 'active' | 'inactive';
      roleId?: string;
      search?: string;
    }
  ): Promise<UserApiResponse> {
    let query = supabase
      .from('users')
      .select(
        `
        *,
        user_roles (
          roles (
            id,
            name
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Apply status filter
    if (filters?.status === 'active') {
      query = query.is('deleted_at', null);
    } else if (filters?.status === 'inactive') {
      query = query.not('deleted_at', 'is', null);
    }

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,username.ilike.%${filters.search}%`
      );
    }

    // Apply pagination if provided
    if (page && limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to flatten roles
    let transformedData = (data || []).map((user: any) => ({
      ...user,
      roles: user.user_roles.map((ur: any) => ur.roles),
    }));

    // Client-side filter by role if needed (because of join complexity)
    if (filters?.roleId) {
      transformedData = transformedData.filter((user) =>
        user.roles.some((role: any) => role.id === filters.roleId)
      );
    }

    const totalPages = count && limit ? Math.ceil(count / limit) : 0;

    return {
      data: transformedData,
      pagination:
        page && limit
          ? {
              page,
              limit,
              total: count || 0,
              totalPages,
            }
          : undefined,
    };
  }

  async getCounts(filters?: { roleId?: string }): Promise<{
    all: number;
    active: number;
    inactive: number;
  }> {
    const buildQuery = () => {
      let q = supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      return q;
    };

    try {
      const { count: allCount } = await buildQuery();
      const { count: activeCount } = await buildQuery().is('deleted_at', null);
      const { count: inactiveCount } = await buildQuery().not(
        'deleted_at',
        'is',
        null
      );

      return {
        all: allCount || 0,
        active: activeCount || 0,
        inactive: inactiveCount || 0,
      };
    } catch (error: any) {
      console.error('Error fetching user counts:', error);
      return { all: 0, active: 0, inactive: 0 };
    }
  }

  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;
    return data;
  }

  async createUser(input: CreateUserInput) {
    // 1. Create User
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: input.username,
        name: input.name,
        password_hash: input.password_hash,
      })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Assign Roles
    if (input.role_ids.length > 0) {
      const roleInserts = input.role_ids.map((roleId) => ({
        user_id: user.id,
        role_id: roleId,
      }));

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (roleError) throw roleError;
    }

    return user;
  }

  async updateUser(id: string, input: Partial<CreateUserInput>) {
    // 1. Update User basic info
    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.username) updateData.username = input.username;
    if (input.password_hash) updateData.password_hash = input.password_hash;

    if (Object.keys(updateData).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (userError) throw userError;
    }

    // 2. Update Roles if provided
    if (input.role_ids !== undefined) {
      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', id);

      // Insert new roles
      if (input.role_ids.length > 0) {
        const roleInserts = input.role_ids.map((roleId) => ({
          user_id: id,
          role_id: roleId,
        }));

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (roleError) throw roleError;
      }
    }
  }

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async restoreUser(id: string) {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) throw error;
  }
}

export default UserAPI;
