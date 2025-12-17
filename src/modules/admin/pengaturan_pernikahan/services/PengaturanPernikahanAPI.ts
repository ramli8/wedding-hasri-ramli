import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PengaturanPernikahan,
  UpdatePengaturanPernikahanInput,
} from '../types/PengaturanPernikahan.types';

class PengaturanPernikahanAPI {
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

  // Get the singleton pengaturan (first row)
  async get(): Promise<PengaturanPernikahan | null> {
    try {
      const { data, error } = await this.supabase
        .from('pengaturan_pernikahan')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      return data as PengaturanPernikahan;
    } catch (error: any) {
      console.error('Error in get:', error);
      throw new Error(error.message || 'Gagal mengambil pengaturan pernikahan');
    }
  }

  // Update the singleton pengaturan
  async update(
    id: string,
    updates: UpdatePengaturanPernikahanInput
  ): Promise<PengaturanPernikahan> {
    try {
      const { data, error } = await this.supabase
        .from('pengaturan_pernikahan')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PengaturanPernikahan;
    } catch (error: any) {
      console.error('Error in update:', error);
      throw new Error(
        error.message || 'Gagal memperbarui pengaturan pernikahan'
      );
    }
  }

  // Create initial pengaturan (if not exists)
  async create(
    data: UpdatePengaturanPernikahanInput
  ): Promise<PengaturanPernikahan> {
    try {
      const { data: result, error } = await this.supabase
        .from('pengaturan_pernikahan')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as PengaturanPernikahan;
    } catch (error: any) {
      console.error('Error in create:', error);
      throw new Error(error.message || 'Gagal membuat pengaturan pernikahan');
    }
  }
}

export default PengaturanPernikahanAPI;
