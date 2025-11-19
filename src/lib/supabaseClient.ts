import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a single instance of the Supabase client
const createSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL dan ANON key harus diatur di environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export default createSupabaseClient();