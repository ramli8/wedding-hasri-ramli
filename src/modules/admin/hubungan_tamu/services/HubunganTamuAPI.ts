import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  HubunganTamu,
  CreateHubunganTamuInput,
  UpdateHubunganTamuInput,
} from '../types/HubunganTamu.types';

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

  async getAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<HubunganTamu[]> {
    try {
      let query = this.supabase
        .from('hubungan_tamu')
        .select('*')
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('nama', { ascending: true });

      // Apply pagination if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HubunganTamu[];
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
