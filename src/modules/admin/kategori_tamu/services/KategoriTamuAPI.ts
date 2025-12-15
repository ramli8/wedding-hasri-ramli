import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  KategoriTamu,
  CreateKategoriTamuInput,
  UpdateKategoriTamuInput,
} from '../types/KategoriTamu.types';

export interface KategoriTamuApiResponse {
  data: KategoriTamu[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class KategoriTamuAPI {
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
    filters?: { status?: 'all' | 'active' | 'inactive' }
  ): Promise<KategoriTamuApiResponse> {
    try {
      let query = this.supabase
        .from('kategori_tamu')
        .select('*', { count: 'exact' })
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('nama', { ascending: true });

      // Apply status filter
      if (filters?.status === 'active') {
        query = query.is('deleted_at', null);
      } else if (filters?.status === 'inactive') {
        query = query.not('deleted_at', 'is', null);
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
        data: data as KategoriTamu[],
        pagination: page && limit ? {
          page,
          limit,
          total: count || 0,
          totalPages,
        } : undefined,
      };
    } catch (error: any) {
      console.error('Error in getAll:', error);
      throw new Error(error.message || 'Gagal mengambil data kategori tamu');
    }
  }

  async getCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('kategori_tamu')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error: any) {
      console.error('Error in getCount:', error);
      throw new Error(error.message || 'Gagal menghitung data');
    }
  }

  async getById(id: string): Promise<KategoriTamu | null> {
    try {
      const { data, error } = await this.supabase
        .from('kategori_tamu')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as KategoriTamu;
    } catch (error: any) {
      console.error('Error in getById:', error);
      throw new Error(error.message || 'Gagal mengambil data kategori tamu');
    }
  }

  async getCounts(): Promise<{ all: number; active: number; inactive: number }> {
    const buildQuery = () => this.supabase.from('kategori_tamu').select('*', { count: 'exact', head: true });
    
    try {
      const { count: allCount } = await buildQuery();
      const { count: activeCount } = await buildQuery().is('deleted_at', null);
      const { count: inactiveCount } = await buildQuery().not('deleted_at', 'is', null);
      
      return { all: allCount || 0, active: activeCount || 0, inactive: inactiveCount || 0 };
    } catch (error: any) {
      console.error('Error fetching kategori counts:', error);
      return { all: 0, active: 0, inactive: 0 };
    }
  }

  async create(data: CreateKategoriTamuInput): Promise<KategoriTamu> {
    try {
      const { data: result, error } = await this.supabase
        .from('kategori_tamu')
        .insert([data])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Nama kategori sudah ada');
        }
        throw error;
      }

      return result as KategoriTamu;
    } catch (error: any) {
      console.error('Error in create:', error);
      throw new Error(error.message || 'Gagal menambahkan kategori tamu');
    }
  }

  async update(
    id: string,
    updates: UpdateKategoriTamuInput
  ): Promise<KategoriTamu> {
    try {
      const { data, error } = await this.supabase
        .from('kategori_tamu')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KategoriTamu;
    } catch (error: any) {
      console.error('Error in update:', error);
      throw new Error(error.message || 'Gagal memperbarui kategori tamu');
    }
  }

  async delete(id: string): Promise<KategoriTamu> {
    try {
      const { data, error } = await this.supabase
        .from('kategori_tamu')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KategoriTamu;
    } catch (error: any) {
      console.error('Error in delete:', error);
      throw new Error(error.message || 'Gagal menghapus kategori tamu');
    }
  }
  async restore(id: string): Promise<KategoriTamu> {
    try {
      const { data, error } = await this.supabase
        .from('kategori_tamu')
        .update({ deleted_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as KategoriTamu;
    } catch (error: any) {
      console.error('Error in restore:', error);
      throw new Error(error.message || 'Gagal memulihkan kategori tamu');
    }
  }
}

export default KategoriTamuAPI;
