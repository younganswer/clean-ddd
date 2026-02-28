import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import { IInventoryReservationRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@CommandHandler(ReserveInventoryForOrderCommand)
export class ReserveInventoryForOrderHandler implements ICommandHandler<ReserveInventoryForOrderCommand> {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItems: IInventoryItemRepository,
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly reservations: IInventoryReservationRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: ReserveInventoryForOrderCommand): Promise<void> {
		const orderId = String(command.input.orderId ?? '').trim();
		if (!orderId) throw new Error('orderId is required');

		await this.uow.transaction(async () => {
			await this.inventoryItems.seedIfEmpty();

			for (const requested of command.input.items ?? []) {
				const sku = String(requested.sku ?? '').trim();
				const quantity = Number(requested.quantity ?? 0);
				if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
					throw new Error('invalid reserve items');
				}

				const existingReservation =
					await this.reservations.findByOrderAndSku(orderId, sku);
				if (existingReservation) {
					continue;
				}

				let stock = await this.inventoryItems.findBySku(sku);
				if (!stock) {
					stock = InventoryItem.create({
						sku,
						priceCurrency: 'USD',
						priceAmountMinor: 100,
						availableQuantity: 0,
						reservedQuantity: 0,
					});
				}
				stock.reserve(quantity);
				await this.inventoryItems.persist(stock);

				const reservation = InventoryReservation.create({
					orderId,
					sku,
					quantity,
				});
				await this.reservations.persist(reservation);
			}
		});
	}
}
