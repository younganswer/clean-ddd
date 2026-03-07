import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '@/modules/ordering/application/commands/create-order.command';
import { CreatePaymentIntentCommand } from '@/modules/payments/application/commands/create-payment-intent.command';

import {
	CreateCheckoutBffCommand,
	type CreateCheckoutBffResult,
} from '@/bff/checkout/application/commands/create-checkout-bff.command';

@CommandHandler(CreateCheckoutBffCommand)
export class CreateCheckoutBffHandler implements ICommandHandler<CreateCheckoutBffCommand> {
	constructor(private readonly commandBus: CommandBus) {}

	async execute(
		command: CreateCheckoutBffCommand,
	): Promise<CreateCheckoutBffResult> {
		const {
			userId,
			amount,
			currency,
			items,
			simulateOutcome,
			simulateDelaySeconds,
		} = command;

		const { orderId } = await this.commandBus.execute(
			new CreateOrderCommand({
				userId,
				amount,
				currency,
				items,
			}),
		);

		const payment = await this.commandBus.execute(
			new CreatePaymentIntentCommand({
				orderId,
				simulateOutcome,
				simulateDelaySeconds,
			}),
		);

		return { orderId, payment };
	}
}
