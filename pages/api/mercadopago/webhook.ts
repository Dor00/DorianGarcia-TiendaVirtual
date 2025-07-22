
// pages/api/mercadopago/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { parseMercadoPagoWebhook } from '@/utils/adapters/mercadopago-webhook.adapter';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const webhookData = await parseMercadoPagoWebhook(req.body);

    if (!webhookData) {
      return res.status(200).json({ message: 'Webhook no procesado' });
    }

    const { status, orderId } = webhookData;

    if (status !== 'approved') {
      return res.status(200).json({ message: 'Pago no aprobado, sin acción' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, order_items ( product_id, cantidad )')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Pedido no encontrado:', orderError?.message);
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    if (order.status === 'pagado') {
      return res.status(200).json({ message: 'Pedido ya procesado' });
    }

    await Promise.all(
      order.order_items.map((item: any) =>
        supabaseAdmin.rpc('descontar_stock', {
          product_id: item.product_id,
          cantidad_a_descontar: item.cantidad,
        })
      )
    );

    await supabaseAdmin
      .from('orders')
      .update({ status: 'pagado' })
      .eq('id', orderId);

    if (order.user_id) {
      await supabaseAdmin
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);
    }

    return res.status(200).json({ message: 'Pago confirmado, stock descontado y carrito limpiado' });
  } catch (error: any) {
    console.error('Error en webhook:', error.message);
    return res.status(500).json({ error: 'Error procesando el webhook' });
  }
}
