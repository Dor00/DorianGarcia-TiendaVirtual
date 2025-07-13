// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Asegúrate de que estas variables de entorno estén configuradas en tu .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Crea un cliente de Supabase usando la Service Role Key.
// Este cliente tiene permisos de administrador y se usa solo en el lado del servidor (API Routes).
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false, // No hay necesidad de persistir la sesión para un cliente de administrador
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
