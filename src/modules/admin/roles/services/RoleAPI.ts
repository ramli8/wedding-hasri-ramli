import supabase from '@/lib/supabaseClient';
import { Role, CreateRoleInput, UpdateRoleInput } from '../types/Role.types';

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

  async getDefaultRole() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_default', true)
      .is('deleted_at', null)
      .single();

    if (error) {
      // If no default role found, return null instead of throwing
      if (error.code === 'PGRST116') return null;
      throw error;
    }
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
