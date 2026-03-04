import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { CreateOrderBffCommand } from '@/bff/orders/application/commands/create-order-bff.command';

@CommandHandler(CreateOrderBffCommand)
export class CreateOrderBffHandler implements ICommandHandler<CreateOrderBffCommand> {
	constructor(private readonly commandBus: CommandBus) {}

	async execute(
		command: CreateOrderBffCommand,
	): Promise<{ orderId: string }> {
		const { userId, amount, currency, items } = command.input.body;

		return await this.commandBus.execute<{ orderId: string }>(
			new CreateOrderCommand({
				userId,
				amount,
				currency,
				items,
			}),
		);
	}
}
