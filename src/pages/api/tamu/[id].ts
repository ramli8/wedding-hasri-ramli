import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Tamu } from '@/modules/admin/tamu/types/Tamu.types';
import TamuAPI from '@/modules/admin/tamu/services/TamuAPI';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { method } = req;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID parameter is required' });
  }

  switch (method) {
    case 'GET':
      return handleGET(req, res, id);
    case 'PUT':
      return handlePUT(req, res, id);
    case 'DELETE':
      return handleDELETE(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGET(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { data, error } = await supabase
      .from('tamu')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    res.status(200).json(data as Tamu);
  } catch (error: any) {
    console.error('Error fetching tamu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePUT(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const updates = req.body;

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

async function handleDELETE(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
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