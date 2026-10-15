import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Error: Variables de Supabase no definidas en .env');
}

/**
 * Cliente único de Supabase. Usa la clave pública: lo que cada persona puede
 * leer o modificar lo decide RLS en la base de datos, no el front.
 */
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
