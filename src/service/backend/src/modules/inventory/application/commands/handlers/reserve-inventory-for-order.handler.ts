import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(IInventoryRepositorySymbol)
		private readonly inventory: IInventoryRepository,
		private readonly em: EntityManager,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');

		await this.em.transactional(async (tx) =>
			RequestContext.create(tx, async () => {
				await this.inventory.seedIfEmpty();
				await this.inventory.reserveForOrder(
					orderId,
					command.input.items ?? [],
				);
				await tx.flush();
			}),
		);
	}
}
