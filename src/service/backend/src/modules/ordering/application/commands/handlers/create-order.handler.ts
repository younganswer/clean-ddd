import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orders: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
		return this.uow.transaction(async () => {
			const order = await this.orders.create({
				...command.input,
			});
			return { orderId: order.uuid };
		});
	}
}
