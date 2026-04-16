import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@/modules/ordering/application/commands/create-order.command';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '@/modules/ordering/domain/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domain/repositories/i.order.repository';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { Order } from '@/modules/ordering/domain/entities/aggregates/order/order.aggregate';
import { Money } from '@/shared/money/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domain/value-objects/order-item.vo';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orderRepository: IOrderRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
		return this.uow.transaction(async () => {
			const { userId, amount, currency } = command;
			const total = Money.of(amount, currency);
			const items =
				command.items?.map((item) =>
					OrderItem.of(item.sku, item.quantity),
				) ?? [];
			const order = Order.create({
				userId,
				total,
				items,
			});

			await this.orderRepository.persist(order);

			return { orderId: order.id };
		});
	}
}
