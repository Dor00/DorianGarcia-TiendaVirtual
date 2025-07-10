
// api/mercadopago/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { action, data } = req.body;

    if (action !== 'payment.updated' && action !== 'payment.created') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    const paymentId = data?.id;

    if (!paymentId) {
      console.error('ID de pago no recibido');
      return res.status(400).json({ error: 'ID de pago faltante' });
    }

    // Llamada directa a la API REST de MercadoPago para evitar problemas de tipado
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error('Error consultando pago:', await mpResponse.text());
      return res.status(500).json({ error: 'Error consultando pago' });
    }

    const paymentData = await mpResponse.json();
    const status = paymentData.status;
    const metadata = paymentData.metadata;

    console.log('Estado del pago:', status);
    console.log('Metadata recibida:', metadata);

    if (status !== 'approved') {
      return res.status(200).json({ message: 'Pago no aprobado, sin acción' });
    }

    const orderId = metadata?.order_id;

    if (!orderId) {
      console.error('order_id no encontrado en metadata');
      return res.status(400).json({ error: 'Metadata inválida' });
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

    const descontarPromises = order.order_items.map((item: any) => {
      return supabaseAdmin.rpc('descontar_stock', {
        product_id: item.product_id,
        cantidad_a_descontar: item.cantidad,
      });
    });

    await Promise.all(descontarPromises);

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'pagado' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error actualizando estado:', updateError.message);
      return res.status(500).json({ error: 'Error actualizando estado' });
    }

    if (order.user_id) {
      const { error: cartError } = await supabaseAdmin
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);

      if (cartError) {
        console.error('Error limpiando carrito:', cartError.message);
      }
    }

    return res.status(200).json({ message: 'Pago confirmado, stock descontado y carrito limpiado' });
  } catch (error: any) {
    console.error('Error procesando webhook:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}

