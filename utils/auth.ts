import { supabaseServer } from '@/lib/supabaseServer';
import type { NextApiRequest } from 'next';

/**
 * Extrae el usuario autenticado desde la request.
 * Retorna el objeto de usuario o null si no está autenticado.
 */
export async function getUserFromRequest(req: NextApiRequest) {
  try {
    const token = req.cookies['sb-access-token'] || '';

    if (!token) {
      return null;
    }

    const { data, error } = await supabaseServer.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    console.error('Error extrayendo usuario de la request:', err);
    return null;
  }
}
