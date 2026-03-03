import { Inject, Injectable } from '@nestjs/common';
import {
	IInventoryItemRepositorySymbol,
	type IInventoryItemRepository,
} from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import {
	IInventoryReservationRepositorySymbol,
	type IInventoryReservationRepository,
} from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { INVENTORY_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';

@Injectable()
export class InventoryReservationDomainService {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItemRepository: IInventoryItemRepository,
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly reservations: IInventoryReservationRepository,
	) {}

	async reserve(input: {
		orderId: string;
		items: Array<{ sku: string; quantity: number }>;
	}): Promise<void> {
		const orderId = String(input.orderId ?? '').trim();
		if (!orderId) {
			throw DomainErrorFactory.create(
				INVENTORY_DOMAIN_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
			);
		}

		await this.inventoryItemRepository.seedIfEmpty();

		for (const requested of input.items ?? []) {
			const sku = String(requested.sku ?? '').trim();
			const quantity = Number(requested.quantity ?? 0);
			if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
				throw DomainErrorFactory.create(
					INVENTORY_DOMAIN_ERRORS.INVENTORY_RESERVE_ITEMS_INVALID,
					{
						details: { requested },
					},
				);
			}

			const existingReservation =
				await this.reservations.findByOrderAndSku(orderId, sku);
			if (existingReservation) {
				continue;
			}

			const stock = await this.inventoryItemRepository.findBySku(sku);
			if (!stock) {
				throw DomainErrorFactory.create(
					INVENTORY_DOMAIN_ERRORS.INVENTORY_ITEM_NOT_FOUND,
					{
						message: `inventory item not found: sku=${sku}`,
						details: { sku },
					},
				);
			}

			stock.reserve(quantity);
			await this.inventoryItemRepository.persist(stock);

			const reservation = InventoryReservation.create({
				orderId,
				sku,
				quantity,
			});
			await this.reservations.persist(reservation);
		}
	}
}
