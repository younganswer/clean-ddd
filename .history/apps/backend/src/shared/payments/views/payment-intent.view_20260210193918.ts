import type { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentIntentView = {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};
