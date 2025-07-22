/**
 * lib/middleware/withRole.ts
 * 
 * Este middleware verifica que el usuario tenga el rol requerido para acceder a la ruta.
 * 
 * @param handler La función manejadora de la ruta.
 * @param requiredRoleName El nombre del rol requerido (por defecto 'user').
 * @returns Una función manejadora que verifica el rol del usuario antes de permitir el acceso a la ruta.
 * 
 * Ejemplo de uso:
 * 
 * import { withRole } from '@/lib/middleware/withRole';
 * 
 * export default withRole(handler, 'admin');
 * 
 * Este código define un middleware que verifica que el usuario tenga el rol 'admin' para acceder a la ruta.
 * Middleware que requiere un rol específico (por defecto 'user').
 */

import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService'; // Assuming this provides a service role client
import { getUserFromRequestOrHeader } from '@/utils/auth/getUserFromRequest';


export const withRole = (handler: NextApiHandler, requiredRoleName: string = 'user'): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // 1. Get the authenticated user's ID from Supabase Auth
    const user = await getUserFromRequestOrHeader(req, res);
    if (!user) {
      // User not logged in
      return res.status(401).json({ message: 'No autorizado: sesión no válida' });
    }

    // 2. Fetch the user's *role UUID* from your `usuarios` table
    //    We need `getServiceSupabase()` because this is server-side and needs elevated privileges.
    const { data: userData, error: userFetchError } = await getServiceSupabase()
      .from('usuarios')
      .select('id_rol') // SELECT the foreign key column (UUID)
      .eq('id', user.id) // WHERE user.id matches the Supabase Auth user ID
      .single();

    if (userFetchError || !userData || !userData.id_rol) {
      // Could not find user in `usuarios` or their `rol` is missing/null
      return res.status(403).json({ message: 'Prohibido: No se pudo verificar el rol del usuario' });
    }

    // 3. Use the fetched role UUID to get the *role name* from the `roles` table
    const { data: roleData, error: roleFetchError } = await getServiceSupabase()
      .from('roles')
      .select('nombre') // SELECT the role name
      .eq('id', userData.id_rol) // WHERE id in `roles` matches the user's `rol` UUID
      .single();

    if (roleFetchError || !roleData || roleData.nombre !== requiredRoleName) {
      // Role name not found or does not match the required role name
      return res.status(403).json({ message: 'Prohibido: rol insuficiente' });
    }

    // 4. If all checks pass, allow access
    (req as any).user = user; // Optionally attach user object to request
    return handler(req, res);
  };
};