// /pages/api/orders/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { getUserFromRequest } from '@/utils/authUtils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
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
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
