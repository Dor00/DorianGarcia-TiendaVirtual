//lib/middleware/withAuth.ts:
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getUserFromRequestOrHeader } from '@/utils/auth/getUserFromRequest';

/**
 * Middleware que protege una ruta si no hay sesión.
 */
export function withAuth(handler: NextApiHandler, p0: string[]): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getUserFromRequestOrHeader(req, res);

    if (!user) {
      return res.status(401).json({ message: 'No autorizado: sesión no válida' });
    }

    // Guardar el usuario en req para siguientes middlewares o el handler
    (req as any).user = user;
    return handler(req, res);
  };
}
