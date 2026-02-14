import type { PaymentStatus } from '@/shared/payments/enums/payment-status.enum';

export type PaymentIntentView = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};
