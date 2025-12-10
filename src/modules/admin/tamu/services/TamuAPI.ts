import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Tamu,
  TamuFilter,
  CreateTamuInput,
  UpdateTamuInput,
  TamuApiResponse,
} from '../types/Tamu.types';

class TamuAPI {
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

  // Method untuk mendapatkan daftar tamu
  async getTamu(filter?: TamuFilter): Promise<TamuApiResponse> {
    try {
      let query = this.supabase
        .from('tamu')
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      // Apply filters - need to filter by kategori_tamu.nama
      if (filter?.kategori) {
        query = query.eq('kategori_tamu.nama', filter.kategori);
      }

      if (filter?.hubungan) {
        query = query.eq('hubungan_tamu.nama', filter.hubungan);
      }

      if (filter?.status_undangan) {
        query = query.eq('status_undangan', filter.status_undangan);
      }

      if (filter?.konfirmasi_kehadiran) {
        query = query.eq('konfirmasi_kehadiran', filter.konfirmasi_kehadiran);
      }

      if (filter?.search) {
        query = query.or(
          `nama.ilike.%${filter.search}%,nomor_hp.ilike.%${filter.search}%`
        );
      }

      // Apply pagination if provided
      if (filter?.page && filter?.limit) {
        const offset = (filter.page - 1) * filter.limit;
        query = query.range(offset, offset + filter.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        kategori: item.kategori_tamu?.nama || '',
        hubungan: item.hubungan_tamu?.nama || '',
        // Remove the joined objects to keep the response clean
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      }));

      const totalPages = count ? Math.ceil(count / (filter?.limit || 10)) : 0;

      return {
        data: mappedData as Tamu[],
        pagination:
          filter?.page && filter?.limit
            ? {
                page: filter.page,
                limit: filter.limit,
                total: count || 0,
                totalPages,
              }
            : undefined,
      };
    } catch (error: any) {
      console.error('Error in getTamu:', error);
      throw new Error(error.message || 'Gagal mengambil data tamu');
    }
  }

  // Method untuk mendapatkan tamu berdasarkan ID
  async getTamuById(id: string): Promise<Tamu | null> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in getTamuById:', error);
      throw new Error(error.message || 'Gagal mengambil data tamu');
    }
  }

  // Method untuk membuat tamu baru
  async createTamu(tamuData: CreateTamuInput): Promise<Tamu> {
    try {
      // Generate 6-digit random QR code
      const qr_code = Math.floor(100000 + Math.random() * 900000).toString();

      const { data, error } = await this.supabase
        .from('tamu')
        .insert([
          {
            nama: tamuData.nama,
            kategori_id: tamuData.kategori_id,
            hubungan_id: tamuData.hubungan_id,
            alamat: tamuData.alamat,
            nomor_hp: tamuData.nomor_hp,
            qr_code,
            status_undangan: 'belum_dikirim',
            konfirmasi_kehadiran: 'belum_konfirmasi',
            tgl_mulai_resepsi: tamuData.tgl_mulai_resepsi,
            tgl_akhir_resepsi: tamuData.tgl_akhir_resepsi,
          },
        ])
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (error) {
        console.error('Error creating tamu:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);

        // Check for duplicate phone number (unique constraint violation)
        // Check in both message and details
        const errorText = `${error.message} ${
          error.details || ''
        }`.toLowerCase();
        if (error.code === '23505' && errorText.includes('nomor_hp')) {
          throw new Error(
            'Nomor HP ini sudah digunakan oleh tamu lain. Mohon gunakan nomor yang berbeda.'
          );
        }

        // Check for other unique violations
        if (error.code === '23505') {
          throw new Error('Data sudah terdaftar');
        }

        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in createTamu:', error);
      throw new Error(error.message || 'Gagal menambahkan tamu baru');
    }
  }

  // Method untuk memperbarui tamu
  async updateTamu(id: string, updates: UpdateTamuInput): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (error) {
        console.error('Error updating tamu:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);

        // Check for duplicate phone number (unique constraint violation)
        const errorText = `${error.message} ${
          error.details || ''
        }`.toLowerCase();
        if (error.code === '23505' && errorText.includes('nomor_hp')) {
          throw new Error(
            'Nomor HP ini sudah digunakan oleh tamu lain. Mohon gunakan nomor yang berbeda.'
          );
        }

        // Check for other unique violations
        if (error.code === '23505') {
          throw new Error('Data sudah terdaftar');
        }

        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in updateTamu:', error);
      throw new Error(error.message || 'Gagal memperbarui data tamu');
    }
  }

  // Method untuk menghapus tamu (soft delete)
  async deleteTamu(id: string): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      return data as Tamu;
    } catch (error: any) {
      console.error('Error in deleteTamu:', error);
      throw new Error(error.message || 'Gagal menghapus data tamu');
    }
  }

  // Method untuk restore tamu yang sudah dihapus
  async restoreTamu(id: string): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({ deleted_at: null })
        .eq('id', id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in restoreTamu:', error);
      throw new Error(error.message || 'Gagal memulihkan data tamu');
    }
  }

  // Method untuk update status kehadiran
  async updateStatusKehadiran(
    id: string,
    status: 'akan_hadir' | 'tidak_hadir' | 'belum_konfirmasi'
  ): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({
          konfirmasi_kehadiran: status,
          tgl_kirim_undangan: new Date().toISOString(), // Update tanggal konfirmasi
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      return data as Tamu;
    } catch (error: any) {
      console.error('Error in updateStatusKehadiran:', error);
      throw new Error(error.message || 'Gagal memperbarui status kehadiran');
    }
  }

  // Method untuk update status undangan
  async updateStatusUndangan(
    id: string,
    status: 'dikirim' | 'belum_dikirim' | 'kadaluarsa'
  ): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({
          status_undangan: status,
          ...(status === 'dikirim' && {
            tgl_kirim_undangan: new Date().toISOString(),
          }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      return data as Tamu;
    } catch (error: any) {
      console.error('Error in updateStatusUndangan:', error);
      throw new Error(error.message || 'Gagal memperbarui status undangan');
    }
  }

  // Method untuk update check-in time
  async updateCheckIn(id: string): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({
          check_in: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in updateCheckIn:', error);
      throw new Error(error.message || 'Gagal memperbarui waktu check-in');
    }
  }

  // Method untuk update check-out time
  async updateCheckOut(id: string): Promise<Tamu> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .update({
          check_out: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (error) {
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in updateCheckOut:', error);
      throw new Error(error.message || 'Gagal memperbarui waktu check-out');
    }
  }

  // Method untuk validasi QR code
  async validateQRCode(qrCode: string): Promise<Tamu | null> {
    try {
      const { data, error } = await this.supabase
        .from('tamu')
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .eq('qr_code', qrCode)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(this.formatError(error));
      }

      // Map the data to include kategori and hubungan names
      const mappedData = {
        ...data,
        kategori: data.kategori_tamu?.nama || '',
        hubungan: data.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return mappedData as Tamu;
    } catch (error: any) {
      console.error('Error in validateQRCode:', error);
      throw new Error(error.message || 'Gagal memvalidasi QR code');
    }
  }

  // OPTIMIZED: Direct check-in without separate validation (faster)
  async directCheckIn(
    qrCode: string
  ): Promise<{ success: boolean; guest: Tamu | null; error?: string }> {
    try {
      // First, get the guest data
      const { data: guestData, error: fetchError } = await this.supabase
        .from('tamu')
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .eq('qr_code', qrCode)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            success: false,
            guest: null,
            error: 'QR Code tidak valid atau tamu tidak ditemukan.',
          };
        }
        throw new Error(this.formatError(fetchError));
      }

      // Check if already checked in
      if (guestData.check_in) {
        const mappedGuest = {
          ...guestData,
          kategori: guestData.kategori_tamu?.nama || '',
          hubungan: guestData.hubungan_tamu?.nama || '',
          kategori_tamu: undefined,
          hubungan_tamu: undefined,
        };
        return {
          success: false,
          guest: mappedGuest as Tamu,
          error: `Tamu ini sudah check-in pada ${new Date(
            guestData.check_in
          ).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        };
      }

      // Perform check-in
      const { data: updatedData, error: updateError } = await this.supabase
        .from('tamu')
        .update({ check_in: new Date().toISOString() })
        .eq('id', guestData.id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (updateError) {
        throw new Error(this.formatError(updateError));
      }

      const mappedGuest = {
        ...updatedData,
        kategori: updatedData.kategori_tamu?.nama || '',
        hubungan: updatedData.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return { success: true, guest: mappedGuest as Tamu };
    } catch (error: any) {
      console.error('Error in directCheckIn:', error);
      throw new Error(error.message || 'Gagal memproses check-in');
    }
  }

  // OPTIMIZED: Direct check-out without separate validation (faster)
  async directCheckOut(
    qrCode: string
  ): Promise<{ success: boolean; guest: Tamu | null; error?: string }> {
    try {
      // First, get the guest data
      const { data: guestData, error: fetchError } = await this.supabase
        .from('tamu')
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .eq('qr_code', qrCode)
        .is('deleted_at', null)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            success: false,
            guest: null,
            error: 'QR Code tidak valid atau tamu tidak ditemukan.',
          };
        }
        throw new Error(this.formatError(fetchError));
      }

      // Check if not checked in yet
      if (!guestData.check_in) {
        const mappedGuest = {
          ...guestData,
          kategori: guestData.kategori_tamu?.nama || '',
          hubungan: guestData.hubungan_tamu?.nama || '',
          kategori_tamu: undefined,
          hubungan_tamu: undefined,
        };
        return {
          success: false,
          guest: mappedGuest as Tamu,
          error: 'Tamu ini belum check-in. Silakan check-in terlebih dahulu.',
        };
      }

      // Check if already checked out
      if (guestData.check_out) {
        const mappedGuest = {
          ...guestData,
          kategori: guestData.kategori_tamu?.nama || '',
          hubungan: guestData.hubungan_tamu?.nama || '',
          kategori_tamu: undefined,
          hubungan_tamu: undefined,
        };
        return {
          success: false,
          guest: mappedGuest as Tamu,
          error: `Tamu ini sudah check-out pada ${new Date(
            guestData.check_out
          ).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        };
      }

      // Perform check-out
      const { data: updatedData, error: updateError } = await this.supabase
        .from('tamu')
        .update({ check_out: new Date().toISOString() })
        .eq('id', guestData.id)
        .select(
          `
          *,
          kategori_tamu:kategori_id(nama),
          hubungan_tamu:hubungan_id(nama)
        `
        )
        .single();

      if (updateError) {
        throw new Error(this.formatError(updateError));
      }

      const mappedGuest = {
        ...updatedData,
        kategori: updatedData.kategori_tamu?.nama || '',
        hubungan: updatedData.hubungan_tamu?.nama || '',
        kategori_tamu: undefined,
        hubungan_tamu: undefined,
      };

      return { success: true, guest: mappedGuest as Tamu };
    } catch (error: any) {
      console.error('Error in directCheckOut:', error);
      throw new Error(error.message || 'Gagal memproses check-out');
    }
  }

  // Helper method untuk format error
  private formatError(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (error.error) {
      return error.error;
    }

    return 'Terjadi kesalahan dalam operasi database';
  }
}

export default TamuAPI;
