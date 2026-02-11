import { Command } from '@nestjs/cqrs';

export type CreatePaymentIntentResult = {
  paymentId: string;
  status: string;
  scheduled: {
    eventType: string;
    delaySeconds: number;
    outboxId: string;
  };
};

export class CreatePaymentIntentCommand extends Command<CreatePaymentIntentResult> {
  constructor(
    public readonly input: {
      orderId: string;
      simulateOutcome?: 'SUCCEEDED' | 'FAILED';
      simulateDelaySeconds?: number;
    },
  ) {
    super();
  }
}
