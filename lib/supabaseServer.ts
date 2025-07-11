// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// ✅ Cliente general sin contexto (solo para tareas simples)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Cliente contextual con cookies (SSR o API Routes)
export function getSupabaseServerClient(req: NextApiRequest, res: NextApiResponse) {
  return createPagesServerClient({ req, res });
}
