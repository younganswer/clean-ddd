import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '../../../../../shared/ordering/commands/create-order.command';
import {
  CreatePaymentIntentCommand,
  type CreatePaymentIntentResult,
} from '../../../../../shared/payments/commands/create-payment-intent.command';

import {
  CreateCheckoutBffCommand,
  type CreateCheckoutBffResult,
} from '../create-checkout-bff.command';

@CommandHandler(CreateCheckoutBffCommand)
export class CreateCheckoutBffHandler implements ICommandHandler<CreateCheckoutBffCommand> {
  constructor(private readonly commandBus: CommandBus) {}

  async execute(
    command: CreateCheckoutBffCommand,
  ): Promise<CreateCheckoutBffResult> {
    const body = command.input.body;

    const { orderId } = await this.commandBus.execute<
      CreateOrderCommand,
      { orderId: string }
    >(
      new CreateOrderCommand({
        userId: body.userId,
        amount: body.amount,
        currency: body.currency,
        items: body.items,
      }),
    );

    const payment = await this.commandBus.execute<
      CreatePaymentIntentCommand,
      CreatePaymentIntentResult
    >(
      new CreatePaymentIntentCommand({
        orderId,
        simulateOutcome: body.simulateOutcome,
        simulateDelaySeconds: body.simulateDelaySeconds,
      }),
    );

    return { orderId, payment };
  }
}
