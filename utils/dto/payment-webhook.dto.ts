// utils/dto/payment-webhook.dto.ts

export interface PaymentWebhookData {
    paymentId: string;
    status: string;
    orderId: string;
  }
  