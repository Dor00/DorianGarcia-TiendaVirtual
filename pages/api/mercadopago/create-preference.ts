// api/mercadopago/create-preference.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items, order_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !order_id) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const preference = {
      items: items.map((item: any) => ({
        id: String(item.productos.id),
        title: item.productos.nombre,
        unit_price: Number(item.productos.precio),
        quantity: item.cantidad,
        currency_id: 'COP',
      })),
      back_urls: {
        success: `https://doriangarcia-tienda-virtual.vercel.app/success`,
        failure: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=failure`,
        pending: `https://doriangarcia-tienda-virtual.vercel.app/cart?status=pending`,
      },

      auto_return: 'approved',
      metadata: {
        order_id, // Aquí pasamos el order_id para que el webhook lo use
      },
    };
    const preferenceClient = new Preference(mercadopago);
    const response = await preferenceClient.create({ body: preference });
    return res.status(200).json({ init_point: response.init_point });
  } catch (error: any) {
    console.error('Error creando preferencia:', error.message);
    return res.status(500).json({ error: 'Error interno' });
  }
}
