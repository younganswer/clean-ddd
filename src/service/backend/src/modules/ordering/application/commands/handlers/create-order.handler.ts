import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
		return this.uow.transaction(async () => {
			const total = Money.of(
				command.input.amount,
				command.input.currency,
			);
			const items =
				command.input.items?.map((i) =>
					OrderItem.of(i.sku, i.quantity),
				) ?? [];
			const order = Order.create({
				userId: command.input.userId,
				total,
				items,
			});

			await this.orderRepository.persist(order);

			return { orderId: order.id };
		});
	}
}
