import type { PaymentStatus } from '@/shared/payments/enums/payment-status.enum';

export type CreatePaymentIntentResult = {
  paymentId: string;
  status: PaymentStatus;
  scheduled: {
    eventType: string;
    delaySeconds: number;
    outboxId: string;
  };
};

export class CreatePaymentIntentCommand {
  constructor(
    public readonly input: {
      orderId: string;
      simulateOutcome?: 'SUCCEEDED' | 'FAILED';
      simulateDelaySeconds?: number;
    },
  ) {}
}
