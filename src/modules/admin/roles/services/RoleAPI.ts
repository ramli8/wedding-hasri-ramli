import supabase from '@/lib/supabaseClient';
import { Role, CreateRoleInput, UpdateRoleInput } from '../types/Role.types';

export interface RoleApiResponse {
  data: Role[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class RoleAPI {
  async getRoles(
    includeDeleted: boolean = false,
    page?: number,
    limit?: number,
    filters?: { status?: 'all' | 'active' | 'inactive' }
  ): Promise<RoleApiResponse> {
    let query = supabase
      .from('roles')
      .select('*', { count: 'exact' })
      .order('deleted_at', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true });

    // Apply status filter
    if (filters?.status === 'active') {
      query = query.is('deleted_at', null);
    } else if (filters?.status === 'inactive') {
      query = query.not('deleted_at', 'is', null);
    } else if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Apply pagination if provided
    if (page && limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const totalPages = count && limit ? Math.ceil(count / limit) : 0;

    return {
      data: data as Role[],
      pagination: page && limit ? {
        page,
        limit,
        total: count || 0,
        totalPages,
      } : undefined,
    };
  }

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async getCounts(): Promise<{ all: number; active: number; inactive: number }> {
    const buildQuery = () => supabase.from('roles').select('*', { count: 'exact', head: true });
    
    try {
      const { count: allCount } = await buildQuery();
      const { count: activeCount } = await buildQuery().is('deleted_at', null);
      const { count: inactiveCount } = await buildQuery().not('deleted_at', 'is', null);
      
      return { all: allCount || 0, active: activeCount || 0, inactive: inactiveCount || 0 };
    } catch (error: any) {
      console.error('Error fetching role counts:', error);
      return { all: 0, active: 0, inactive: 0 };
    }
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
