// pages/api/mercadopago/create-preference.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMercadoPagoPreference } from '@/utils/adapters/mercadopago.adapter';
import { CreatePaymentDTO } from '@/utils/dto/payment.dto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items, order_id } = req.body;

    if (!items || !Array.isArray(items) || !order_id) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const dto: CreatePaymentDTO = {
      orderId: order_id,
      items: items.map((item: any) => ({
        id: String(item.productos.id),
        title: item.productos.nombre,
        unit_price: Number(item.productos.precio),
        quantity: item.cantidad,
        currency_id: 'COP',
      })),
      successUrl: `https://doriangarcia-tienda-virtual.vercel.app/success`,
      failureUrl: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=failure`,
      pendingUrl: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=pending`,
    };

    const initPoint = await createMercadoPagoPreference(dto);

    return res.status(200).json({ init_point: initPoint });
  } catch (error: any) {
    console.error('Error creando preferencia:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
