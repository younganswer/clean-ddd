import type { CreatePaymentIntentResult } from '../../../../shared/payments/commands/create-payment-intent.command';
import type { CreateCheckoutBffBodyDto } from '../../presentation/checkout-bff.dto';

export type CreateCheckoutBffResult = {
  orderId: string;
  payment: CreatePaymentIntentResult;
};

export class CreateCheckoutBffCommand {
  constructor(
    public readonly input: {
      body: CreateCheckoutBffBodyDto;
    },
  ) {}
}
