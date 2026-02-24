import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInventoryRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(IInventoryRepositorySymbol)
		private readonly inventory: IInventoryRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');

		await this.uow.transaction(async () => {
			await this.inventory.seedIfEmpty();
			await this.inventory.reserveForOrder(
				orderId,
				command.input.items ?? [],
			);
		});
	}
}
