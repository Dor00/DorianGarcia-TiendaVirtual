import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getServiceSupabase } from '@/lib/supabaseService';

export const withAdminAuth = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const supabaseService = getServiceSupabase();
    let user = null;

    // 1. Primero intenta obtener el usuario desde las cookies (SSR clásico)
    try {
      const supabase = getSupabaseServerClient(req, res);
      const { data, error } = await supabase.auth.getUser();

      if (data?.user) {
        user = data.user;
      }
    } catch (err) {
      console.warn('DEBUG (withAdminAuth): Error al leer cookies o sesión del servidor.', err);
    }

    // 2. Si no hay usuario, intenta leer el token del header Authorization
    if (!user) {
      const authHeader = req.headers.authorization;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabaseService.auth.getUser(token);

        if (error || !data?.user) {
          console.warn('Unauthorized access attempt: Invalid token or user not found.');
          return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
        }
        user = data.user;
      }
    }

    // 3. Si sigue sin haber usuario, rechaza la solicitud
    if (!user) {
      console.warn('Unauthorized access attempt: No valid session or token provided.');
      return res.status(401).json({ message: 'Unauthorized: No valid session.' });
    }

    // 4. Valida el rol en la base de datos
    const { data: userData, error: userRoleError } = await supabaseService
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (userRoleError || !userData || userData.rol !== 'admin') {
      console.warn(`Forbidden access attempt for user ${user.id}. Role in DB: ${userData?.rol || 'none'}. Error: ${userRoleError?.message || 'No data.'}`);
      return res.status(403).json({ message: 'Forbidden: User does not have admin privileges.' });
    }

    return handler(req, res);
  };
};
