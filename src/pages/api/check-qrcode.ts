import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { nomor_hp } = req.query;

    // Validasi input
    if (!nomor_hp || typeof nomor_hp !== 'string') {
      return res.status(400).json({ 
        error: 'Nomor HP wajib diisi',
        message: 'Silakan masukkan nomor HP yang valid' 
      });
    }

    // Cari tamu berdasarkan nomor HP
    const { data, error } = await supabase
      .from('tamu')
      .select(`
        id,
        nama,
        qr_code,
        kategori_id,
        hubungan_id,
        kategori_tamu:kategori_id(nama),
        hubungan_tamu:hubungan_id(nama)
      `)
      .eq('nomor_hp', nomor_hp)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return res.status(404).json({ 
          error: 'Tamu tidak ditemukan',
          message: 'Nomor HP tidak terdaftar dalam daftar tamu' 
        });
      }
      throw error;
    }

    // Map data untuk response
    const guestData = {
      id: data.id,
      nama: data.nama,
      qr_code: data.qr_code,
      kategori: data.kategori_tamu?.nama || '',
      hubungan: data.hubungan_tamu?.nama || '',
    };

    res.status(200).json(guestData);
  } catch (error: any) {
    console.error('Error checking QR code:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Terjadi kesalahan saat mencari data tamu' 
    });
  }
}
