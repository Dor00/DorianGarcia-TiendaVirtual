// utils/adapters/mercadopago.adapter.ts

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { CreatePaymentDTO } from '../dto/payment.dto';

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function createMercadoPagoPreference(dto: CreatePaymentDTO) {
  const preference = {
    items: dto.items.map((item) => ({
      id: item.id,
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency_id: item.currency_id,
    })),
    back_urls: {
      success: dto.successUrl,
      failure: dto.failureUrl,
      pending: dto.pendingUrl,
    },
    auto_return: 'approved',
    metadata: {
      order_id: dto.orderId,
    },
  };

  const preferenceClient = new Preference(mercadopago);
  const response = await preferenceClient.create({ body: preference });

  return response.init_point;
}

  