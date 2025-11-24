import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  KategoriTamu,
  CreateKategoriTamuInput,
  UpdateKategoriTamuInput,
} from '../types/KategoriTamu.types';

class KategoriTamuAPI {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL dan ANON key harus diatur di environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async getAll(): Promise<KategoriTamu[]> {
    try {
      const { data, error } = await this.supabase
        .from('kategori_tamu')
        .select('*')
        .is('deleted_at', null)
        .order('nama', { ascending: true });

      if (error) throw error;
      return data as KategoriTamu[];
    } catch (error: any) {
      console.error('Error in getAll:', error);
      throw new Error(error.message || 'Gagal mengambil data kategori tamu');
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

  async update(id: string, updates: UpdateKategoriTamuInput): Promise<KategoriTamu> {
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
