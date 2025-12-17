import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  HubunganTamu,
  CreateHubunganTamuInput,
  UpdateHubunganTamuInput,
} from '../types/HubunganTamu.types';

export interface HubunganTamuApiResponse {
  data: HubunganTamu[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class HubunganTamuAPI {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase URL dan ANON key harus diatur di environment variables'
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async getAll(
    page?: number,
    limit?: number,
    filters?: { status?: 'all' | 'active' | 'inactive'; search?: string }
  ): Promise<HubunganTamuApiResponse> {
    try {
      let query = this.supabase
        .from('hubungan_tamu')
        .select('*', { count: 'exact' })
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('nama', { ascending: true });

      // Apply status filter
      if (filters?.status === 'active') {
        query = query.is('deleted_at', null);
      } else if (filters?.status === 'inactive') {
        query = query.not('deleted_at', 'is', null);
      }

      // Apply search filter
      if (filters?.search) {
        query = query.ilike('nama', `%${filters.search}%`);
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
        data: data as HubunganTamu[],
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
    } catch (error: any) {
      console.error('Error in getAll:', error);
      throw new Error(error.message || 'Gagal mengambil data');
    }
  }

  async getCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('hubungan_tamu')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Error in getCount:', error);
      throw new Error(error.message || 'Gagal menghitung data');
    }
  }

  async getById(id: string): Promise<HubunganTamu | null> {
    try {
      const { data, error } = await this.supabase
        .from('hubungan_tamu')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as HubunganTamu;
    } catch (error: any) {
      console.error('Error in getById:', error);
      throw new Error(error.message || 'Gagal mengambil data');
    }
  }

  async getCounts(): Promise<{
    all: number;
    active: number;
    inactive: number;
  }> {
    const buildQuery = () =>
      this.supabase
        .from('hubungan_tamu')
        .select('*', { count: 'exact', head: true });

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
      console.error('Error fetching hubungan counts:', error);
      return { all: 0, active: 0, inactive: 0 };
    }
  }

  async create(data: CreateHubunganTamuInput): Promise<HubunganTamu> {
    try {
      const { data: result, error } = await this.supabase
        .from('hubungan_tamu')
        .insert([data])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Nama hubungan sudah ada');
        }
        throw error;
      }

      return result as HubunganTamu;
    } catch (error: any) {
      console.error('Error in create:', error);
      throw new Error(error.message || 'Gagal menambahkan hubungan tamu');
    }
  }

  async update(
    id: string,
    updates: UpdateHubunganTamuInput
  ): Promise<HubunganTamu> {
    try {
      const { data, error } = await this.supabase
        .from('hubungan_tamu')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HubunganTamu;
    } catch (error: any) {
      console.error('Error in update:', error);
      throw new Error(error.message || 'Gagal memperbarui hubungan tamu');
    }
  }

  async delete(id: string): Promise<HubunganTamu> {
    try {
      const { data, error } = await this.supabase
        .from('hubungan_tamu')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HubunganTamu;
    } catch (error: any) {
      console.error('Error in delete:', error);
      throw new Error(error.message || 'Gagal menghapus hubungan tamu');
    }
  }

  async restore(id: string): Promise<HubunganTamu> {
    try {
      const { data, error } = await this.supabase
        .from('hubungan_tamu')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as HubunganTamu;
    } catch (error: any) {
      console.error('Error in restore:', error);
      throw new Error(error.message || 'Gagal memulihkan hubungan tamu');
    }
  }
}

export default HubunganTamuAPI;
