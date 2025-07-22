// pages/api/orders/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceSupabase } from '@/lib/supabaseService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { total, items, user_id } = req.body;

  if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos para crear el pedido' });
  }

  try {
    const supabase = getServiceSupabase();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ total, user_id, status: 'pendiente' }])
      .select()
      .single();

    if (orderError) {
      console.error('Error al crear el pedido:', orderError.message);
      return res.status(500).json({ error: 'Error al crear el pedido' });
    }

    const orderItemsPayload = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productos.id,
      cantidad: item.cantidad,
      nombre_producto: item.productos.nombre,
      precio_unitario: item.productos.precio,
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsPayload);

    if (orderItemsError) {
      console.error('Error al crear los items del pedido:', orderItemsError.message);
      return res.status(500).json({ error: 'Error al crear los items del pedido' });
    }

    return res.status(200).json({ message: 'Pedido creado con éxito', order });
  } catch (err: any) {
    console.error('Error inesperado al crear el pedido:', err.message);
    return res.status(500).json({ error: 'Error inesperado en el servidor' });
  }
}
