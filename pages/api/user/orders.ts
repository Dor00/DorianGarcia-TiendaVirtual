// /pages/api/user/orders.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabaseServer';
import { getUserFromRequest } from '@/utils/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { data: orders, error } = await supabaseServer
      .from('orders')
      .select(`id, created_at, total, status`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo pedidos:', error.message);
      return res.status(500).json({ error: 'Error al obtener los pedidos' });
    }

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Error inesperado:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
