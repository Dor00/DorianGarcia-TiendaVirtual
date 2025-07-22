// utils/dto/payment.dto.ts

export interface PaymentItemDTO {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }
  
  export interface CreatePaymentDTO {
    items: PaymentItemDTO[];
    orderId: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
  }
  