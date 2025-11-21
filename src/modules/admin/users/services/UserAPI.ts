import supabase from '@/lib/supabaseClient';

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roles?: Role[];
}

export interface CreateUserInput {
  username: string;
  name: string;
  password_hash: string; // Plain text for now, handled by DB or simple logic
  role_ids: string[];
}

class UserAPI {
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          roles (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to flatten roles
    return data.map((user: any) => ({
      ...user,
      roles: user.user_roles.map((ur: any) => ur.roles)
    }));
  }

  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
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
        password_hash: input.password_hash
      })
      .select()
      .single();

    if (userError) throw userError;

    // 2. Assign Roles
    if (input.role_ids.length > 0) {
      const roleInserts = input.role_ids.map(roleId => ({
        user_id: user.id,
        role_id: roleId
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
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id);

      // Insert new roles
      if (input.role_ids.length > 0) {
        const roleInserts = input.role_ids.map(roleId => ({
          user_id: id,
          role_id: roleId
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
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

export default UserAPI;
