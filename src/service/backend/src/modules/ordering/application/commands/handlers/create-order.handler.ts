import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '@/modules/ordering/domains/repositories/i.order.repository';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
	constructor(
		@Inject(IOrderRepositorySymbol)
		private readonly orders: IOrderRepository,
		private readonly em: EntityManager,
	) {}

	async execute(command: CreateOrderCommand): Promise<{ orderId: string }> {
		return this.em.transactional(async (tx) =>
			RequestContext.create(tx, async () => {
				const order = await this.orders.create({
					...command.input,
				});
				await tx.flush();
				return { orderId: order.uuid };
			}),
		);
	}
}
