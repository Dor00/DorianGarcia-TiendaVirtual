//utils/authUtils.ts
import { supabaseServer } from '@/lib/supabaseServer';
import { NextApiRequest } from 'next';

/**
 * Extrae el usuario autenticado desde la cookie de Supabase en una API Route.
 */
export async function getUserFromRequest(req: NextApiRequest) {
  const access_token = req.cookies['sb-access-token'];

  if (!access_token) {
    console.warn('No se encontró el token de acceso en las cookies.');
    return null;
  }

  const { data: { user }, error } = await supabaseServer.auth.getUser(access_token);

  if (error || !user) {
    console.error('Error obteniendo usuario desde token:', error?.message);
    return null;
  }

  return user;
}
