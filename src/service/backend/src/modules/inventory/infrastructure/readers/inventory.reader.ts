import { Inject, Injectable } from '@nestjs/common';

import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/shared/readers/inventory/i.inventory.reader';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import { IInventoryReservationRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';

@Injectable()
export class InventoryReader implements IInventoryReader {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItems: IInventoryItemRepository,
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly reservations: IInventoryReservationRepository,
	) {}

	async findItemBySku(sku: string): Promise<InventoryItemView | null> {
		await this.inventoryItems.seedIfEmpty();
		const i = await this.inventoryItems.findBySku(sku);
		if (!i) return null;

		return {
			itemId: i.uuid,
			sku: i.sku,
			price: {
				currency: i.priceCurrency,
				amountMinor: i.priceAmountMinor,
			},
			availableQuantity: i.availableQuantity,
			reservedQuantity: i.reservedQuantity,
		};
	}

	async findRecentItems(limit: number): Promise<InventoryItemView[]> {
		await this.inventoryItems.seedIfEmpty();
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const list = await this.inventoryItems.findAll(safeLimit);

		return list.map((i) => ({
			itemId: i.uuid,
			sku: i.sku,
			price: {
				currency: i.priceCurrency,
				amountMinor: i.priceAmountMinor,
			},
			availableQuantity: i.availableQuantity,
			reservedQuantity: i.reservedQuantity,
		}));
	}

	async findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservationView[]> {
		const list = await this.reservations.findReservationsByOrderId(orderId);
		return list.map((r) => ({
			reservationId: r.uuid,
			orderId: r.orderId,
			sku: r.sku,
			quantity: r.quantity,
		}));
	}
}

export const InventoryReaderProvider = {
	provide: IInventoryReaderSymbol,
	useClass: InventoryReader,
};
