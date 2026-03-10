import { Inject, Injectable } from '@nestjs/common';
import {
	IInventoryItemRepositorySymbol,
	type IInventoryItemRepository,
} from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import {
	IInventoryReservationRepositorySymbol,
	type IInventoryReservationRepository,
} from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { INVENTORY_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';

@Injectable()
export class InventoryReservationService {
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

		const requestedBySku = new Map<string, number>();
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

			const current = requestedBySku.get(sku) ?? 0;
			requestedBySku.set(sku, current + quantity);
		}

		if (requestedBySku.size === 0) {
			throw DomainErrorFactory.create(
				INVENTORY_DOMAIN_ERRORS.INVENTORY_RESERVE_ITEMS_INVALID,
			);
		}

		const existingReservations =
			await this.reservations.findReservationsByOrderId(orderId);
		const alreadyReservedSkus = new Set(
			existingReservations.map((reservation) => reservation.sku),
		);

		const stocksToPersist = [] as InventoryItem[];
		const reservationsToPersist = [] as InventoryReservation[];

		for (const [sku, quantity] of requestedBySku.entries()) {
			if (alreadyReservedSkus.has(sku)) {
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
			stocksToPersist.push(stock);
			reservationsToPersist.push(
				InventoryReservation.create({
					orderId,
					sku,
					quantity,
				}),
			);
		}

		for (const stock of stocksToPersist) {
			await this.inventoryItemRepository.persist(stock);
		}

		for (const reservation of reservationsToPersist) {
			await this.reservations.persist(reservation);
		}
	}
}
