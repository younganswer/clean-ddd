import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { CreateOrderBffCommand } from '@/bff/orders/application/commands/create-order-bff.command';

@CommandHandler(CreateOrderBffCommand)
export class CreateOrderBffHandler implements ICommandHandler<CreateOrderBffCommand> {
	constructor(private readonly commandBus: CommandBus) {}

	async execute(
		command: CreateOrderBffCommand,
	): Promise<{ orderId: string }> {
		return await this.commandBus.execute(new CreateOrderCommand(command));
	}
}
