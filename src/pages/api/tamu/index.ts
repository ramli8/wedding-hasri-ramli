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
    const { 
      nama, 
      kategori_id, 
      hubungan_id, 
      alamat, 
      nomor_hp,
      username_instagram
    } = req.body as CreateTamuInput;

    // Validasi input
    if (!nama || !kategori_id || !hubungan_id || !alamat) {
      return res.status(400).json({ error: 'Nama, kategori_id, hubungan_id, dan alamat wajib diisi' });
    }

    // Validasi minimal salah satu kontak harus diisi
    if (!nomor_hp && !username_instagram) {
      return res.status(400).json({ error: 'Minimal salah satu harus diisi: Nomor HP atau Username Instagram' });
    }

    // Validasi format nomor HP (minimal 10 digit)
    if (nomor_hp) {
      // Must be all digits
      if (!/^\d+$/.test(nomor_hp)) {
        return res.status(400).json({ error: 'Nomor HP harus berisi angka saja' });
      }
      // Must be at least 10 digits
      if (nomor_hp.length < 10) {
        return res.status(400).json({ error: 'Nomor HP minimal 10 digit' });
      }
      // Must be at most 15 digits
      if (nomor_hp.length > 15) {
        return res.status(400).json({ error: 'Nomor HP maksimal 15 digit' });
      }
    }

    // Generate 6-digit random QR code
    const qr_code = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert ke database
    const { data, error } = await supabase
      .from('tamu')
      .insert([{
        nama,
        kategori_id,
        hubungan_id,
        alamat,
        nomor_hp,
        username_instagram,
        qr_code,
        konfirmasi_kehadiran: 'belum_konfirmasi'
      }])
      .select(`
        *,
        kategori_tamu:kategori_id(nama),
        hubungan_tamu:hubungan_id(nama)
      `)
      .single();

    if (error) {
      console.error('Error creating tamu:', error);
      
      // Check for duplicate phone number error
      if (error.code === '23505' && error.message.includes('nomor_hp')) {
        return res.status(409).json({ 
          error: 'Nomor HP ini sudah digunakan oleh tamu lain. Mohon gunakan nomor yang berbeda.' 
        });
      }
      
      // Foreign key violation
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Data kategori atau hubungan tidak valid' });
      }
      
      return res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan data' });
    }

    // Map the data to include kategori and hubungan names
    const mappedData = {
      ...data,
      kategori: data.kategori_tamu?.nama || '',
      hubungan: data.hubungan_tamu?.nama || '',
      kategori_tamu: undefined,
      hubungan_tamu: undefined,
    };

    res.status(201).json(mappedData as Tamu);
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

    // Validasi format nomor HP jika ada (minimal 10 digit)
    if (updates.nomor_hp) {
      // Must be all digits
      if (!/^\d+$/.test(updates.nomor_hp)) {
        return res.status(400).json({ error: 'Nomor HP harus berisi angka saja' });
      }
      // Must be at least 10 digits
      if (updates.nomor_hp.length < 10) {
        return res.status(400).json({ error: 'Nomor HP minimal 10 digit' });
      }
      // Must be at most 15 digits
      if (updates.nomor_hp.length > 15) {
        return res.status(400).json({ error: 'Nomor HP maksimal 15 digit' });
      }
    }

    // Update di database
    const { data, error } = await supabase
      .from('tamu')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        kategori_tamu:kategori_id(nama),
        hubungan_tamu:hubungan_id(nama)
      `)
      .single();

    if (error) {
      console.error('Error updating tamu:', error);
      
      // Check for duplicate phone number error
      if (error.code === '23505' && error.message.includes('nomor_hp')) {
        return res.status(409).json({ 
          error: 'Nomor HP ini sudah digunakan oleh tamu lain. Mohon gunakan nomor yang berbeda.' 
        });
      }
      
      // Foreign key violation
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Data kategori atau hubungan tidak valid' });
      }
      
      return res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate data' });
    }

    // Map the data to include kategori and hubungan names
    const mappedData = {
      ...data,
      kategori: data.kategori_tamu?.nama || '',
      hubungan: data.hubungan_tamu?.nama || '',
      kategori_tamu: undefined,
      hubungan_tamu: undefined,
    };

    res.status(200).json(mappedData as Tamu);
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