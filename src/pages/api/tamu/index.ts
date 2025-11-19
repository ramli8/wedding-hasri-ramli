import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Tamu, TamuFilter, CreateTamuInput, UpdateTamuInput } from '@/modules/admin/tamu/types/Tamu.types';
import TamuAPI from '@/modules/admin/tamu/services/TamuAPI';
// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Gunakan service role key untuk operasi admin
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGET(req, res);
    case 'POST':
      return handlePOST(req, res);
    case 'PUT':
      return handlePUT(req, res);
    case 'DELETE':
      return handleDELETE(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// Fungsi untuk menangani GET request (Read all tamu atau filter)
async function handleGET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      page = 1,
      limit = 10,
      kategori,
      hubungan,
      status_undangan,
      konfirmasi_kehadiran,
      search
    } = req.query as TamuFilter;

    // Membangun query dengan filter
    let query = supabase
      .from('tamu')
      .select('*', { count: 'exact' })
      .is('deleted_at', null) // Hanya tampilkan yang tidak dihapus (soft delete)
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1)
      .order('created_at', { ascending: false });

    // Filter berdasarkan kategori
    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    // Filter berdasarkan hubungan
    if (hubungan) {
      query = query.eq('hubungan', hubungan);
    }

    // Filter berdasarkan status undangan
    if (status_undangan) {
      query = query.eq('status_undangan', status_undangan);
    }

    // Filter berdasarkan konfirmasi kehadiran
    if (konfirmasi_kehadiran) {
      query = query.eq('konfirmasi_kehadiran', konfirmasi_kehadiran);
    }

    // Pencarian global
    if (search) {
      query = query.or(`nama.ilike.%${search}%,nomor_hp.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = count ? Math.ceil(count / Number(limit)) : 0;

    res.status(200).json({
      data: data as Tamu[],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching tamu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fungsi untuk menangani POST request (Create new tamu)
async function handlePOST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { nama, kategori, hubungan, alamat, nomor_hp, status_undangan = 'belum_dikirim', konfirmasi_kehadiran = 'belum_konfirmasi', tgl_mulai_resepsi, tgl_akhir_resepsi } = req.body as CreateTamuInput;

    // Validasi input
    if (!nama || !kategori || !hubungan || !alamat || !nomor_hp) {
      return res.status(400).json({ error: 'Nama, kategori, hubungan, alamat, dan nomor_hp wajib diisi' });
    }

    // Generate QR code - bisa menggunakan library qrcode atau hanya string unik
    const qr_code = `tamu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert ke database
    const { data, error } = await supabase
      .from('tamu')
      .insert([{
        nama,
        kategori,
        hubungan,
        alamat,
        nomor_hp,
        qr_code,
        status_undangan,
        konfirmasi_kehadiran,
        tgl_mulai_resepsi,
        tgl_akhir_resepsi
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ error: 'Nomor HP atau QR code sudah terdaftar' });
      }
      throw error;
    }

    res.status(201).json(data as Tamu);
  } catch (error: any) {
    console.error('Error creating tamu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fungsi untuk menangani PUT request (Update tamu)
async function handlePUT(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updates = req.body as UpdateTamuInput;

    // Update di database
    const { data, error } = await supabase
      .from('tamu')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data as Tamu);
  } catch (error: any) {
    console.error('Error updating tamu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Fungsi untuk menangani DELETE request (Soft delete tamu)
async function handleDELETE(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    // Soft delete - hanya update deleted_at
    const { data, error } = await supabase
      .from('tamu')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data as Tamu);
  } catch (error: any) {
    console.error('Error deleting tamu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}