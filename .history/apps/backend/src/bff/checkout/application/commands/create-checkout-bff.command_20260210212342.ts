import type { CreatePaymentIntentResult } from '../../../../shared/payments/commands/create-payment-intent.command';

export type CreateCheckoutBffResult = {
  orderId: string;
  payment: CreatePaymentIntentResult;
};

export class CreateCheckoutBffCommand {
  constructor(
    public readonly input: {
      body: {
        amount: number;
        currency: string;
        items?: Array<{ sku: string; quantity: number }>;
        simulateOutcome?: 'SUCCEEDED' | 'FAILED';
        simulateDelaySeconds?: number;
      };
    },
  ) {}
}
