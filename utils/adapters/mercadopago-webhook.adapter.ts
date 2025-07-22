// utils/adapters/mercadopago-webhook.adapter.ts

import { PaymentWebhookData } from '../dto/payment-webhook.dto';

export async function parseMercadoPagoWebhook(body: any): Promise<PaymentWebhookData | null> {
  const { action, data } = body;

  if (!['payment.updated', 'payment.created'].includes(action)) {
    return null;
  }

  const paymentId = data?.id;

  if (!paymentId) {
    console.error('paymentId no recibido en webhook');
    return null;
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    console.error('Error consultando pago:', await response.text());
    return null;
  }

  const paymentData = await response.json();
  const status = paymentData.status;
  const orderId = paymentData.metadata?.order_id;

  if (!orderId) {
    console.error('order_id no presente en metadata');
    return null;
  }

  return {
    paymentId: String(paymentId),
    status,
    orderId,
  };
}
