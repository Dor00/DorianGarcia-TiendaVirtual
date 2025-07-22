import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { withAuth } from '@/lib/middleware/withAuth';
import { getUserFromRequestOrHeader } from '@/utils/auth/getUserFromRequest';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const user = await getUserFromRequestOrHeader(req, res);
  if (!user) {
    // This case should ideally be handled by withAuth middleware, but for type safety
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  const supabase = getSupabaseServerClient(req, res);

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      status,
      created_at,
      order_items (
        id,
        cantidad,
        precio_unitario,
        productos (
          id,
          nombre,
          descripcion,
          precio,
          imagen_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener pedidos:', error.message);
    return res.status(500).json({ error: 'Error al obtener los pedidos' });
  }

  return res.status(200).json({ orders: data });
}

export default withAuth(handler, []);
