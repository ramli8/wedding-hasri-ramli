import supabase from '@/lib/supabaseClient';

export interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface CreateRoleInput {
  name: string;
  description: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

class RoleAPI {
  async getRoles(includeDeleted: boolean = false) {
    let query = supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Role[];
  }

  async createRole(input: CreateRoleInput) {
    const { data, error } = await supabase
      .from('roles')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  }

  async updateRole(id: string, input: UpdateRoleInput) {
    const { data, error } = await supabase
      .from('roles')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  }

  async deleteRole(id: string) {
    // Soft delete
    const { data, error } = await supabase
      .from('roles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  }

  async restoreRole(id: string) {
    const { data, error } = await supabase
      .from('roles')
      .update({ deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Role;
  }
}

export default RoleAPI;
