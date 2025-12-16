import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { nomor_hp, id, username_instagram } = req.query;

    // Validasi input - harus ada salah satu
    if (
      (!nomor_hp || typeof nomor_hp !== 'string') &&
      (!id || typeof id !== 'string') &&
      (!username_instagram || typeof username_instagram !== 'string')
    ) {
      return res.status(400).json({
        error: 'Parameter tidak valid',
        message:
          'Silakan masukkan nomor HP, username Instagram, atau ID yang valid',
      });
    }

    let query = supabase
      .from('tamu')
      .select(
        `
        id,
        nama,
        qr_code,
        kategori_id,
        hubungan_id,
        tgl_baca_cek_qr_code,
        kategori_tamu:kategori_id(nama),
        hubungan_tamu:hubungan_id(nama)
      `
      )
      .is('deleted_at', null);

    // Cari berdasarkan ID, nomor HP, atau username Instagram
    if (id && typeof id === 'string') {
      query = query.eq('id', id);
    } else if (nomor_hp && typeof nomor_hp === 'string') {
      query = query.eq('nomor_hp', nomor_hp);
    } else if (username_instagram && typeof username_instagram === 'string') {
      // Remove @ if present
      const cleanUsername = username_instagram.startsWith('@')
        ? username_instagram.substring(1)
        : username_instagram;
      query = query.eq('username_instagram', cleanUsername);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        let errorMessage = 'Data tidak ditemukan';
        if (nomor_hp)
          errorMessage = 'Nomor HP tidak terdaftar dalam daftar tamu';
        else if (username_instagram)
          errorMessage = 'Username Instagram tidak terdaftar dalam daftar tamu';
        else if (id) errorMessage = 'ID tamu tidak ditemukan';

        return res.status(404).json({
          error: 'Tamu tidak ditemukan',
          message: errorMessage,
        });
      }
      throw error;
    }

    // Update tgl_baca_cek_qr_code jika belum pernah dibaca
    if (!data.tgl_baca_cek_qr_code) {
      await supabase
        .from('tamu')
        .update({ tgl_baca_cek_qr_code: new Date().toISOString() })
        .eq('id', data.id);
      console.log('✅ tgl_baca_cek_qr_code updated for:', data.id);
    }

    // Map data untuk response
    const guestData = {
      id: data.id,
      nama: data.nama,
      qr_code: data.qr_code,
      kategori: Array.isArray(data.kategori_tamu)
        ? data.kategori_tamu[0]?.nama
        : (data.kategori_tamu as any)?.nama || '',
      hubungan: Array.isArray(data.hubungan_tamu)
        ? data.hubungan_tamu[0]?.nama
        : (data.hubungan_tamu as any)?.nama || '',
    };

    res.status(200).json(guestData);
  } catch (error: any) {
    console.error('Error checking QR code:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat mencari data tamu',
    });
  }
}
