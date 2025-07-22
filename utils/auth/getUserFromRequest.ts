import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getServiceSupabase } from '@/lib/supabaseService';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Obtiene el usuario autenticado desde cookies o header Authorization.
 */
export async function getUserFromRequestOrHeader(req: NextApiRequest, res: NextApiResponse) {
  // 1. Intentar obtener desde cookies (SSR - Supabase Auth)
  try {
    const supabase = getSupabaseServerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    // Continuar al paso 2
  }

  // 2. Intentar desde header Authorization (ej: Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await getServiceSupabase().auth.getUser(token);
    if (!error && data?.user) return data.user;
  }

  return null;
}
