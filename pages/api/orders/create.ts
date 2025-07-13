// api/orders/create.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { total, items, user_id } = req.body;

  if (!total || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    const supabase = getSupabaseServerClient(req, res);

    // Crear el pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ total, status: 'pendiente', user_id }])
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Error creando pedido:', orderError?.message);
      return res.status(500).json({ error: 'Error al crear el pedido' });
    }

    // Crear los items del pedido
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productos.id,
      cantidad: item.cantidad,
      nombre_producto: item.productos.nombre,
      precio_unitario: item.productos.precio, // IMPORTANTE: este campo es obligatorio en tu tabla
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creando items del pedido:', itemsError.message);
      return res.status(500).json({ error: 'Error al crear los items del pedido' });
    }

    return res.status(200).json({ order });
  } catch (error: any) {
    console.error('Error creando pedido:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
