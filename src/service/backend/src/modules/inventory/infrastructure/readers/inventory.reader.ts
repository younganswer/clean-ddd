import { Inject, Injectable } from '@nestjs/common';

import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/shared/readers/inventory/i.inventory.reader';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import type { InventoryReservationResult } from '@/shared/readers/inventory/dto/inventory-reservation.result';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import { IInventoryReservationRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';

@Injectable()
export class InventoryReader implements IInventoryReader {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItemRepository: IInventoryItemRepository,
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly inventoryReservationRepository: IInventoryReservationRepository,
	) {}

	async findItemBySku(sku: string): Promise<InventoryItemResult | null> {
		await this.inventoryItemRepository.seedIfEmpty();
		const inventoryItem = await this.inventoryItemRepository.findBySku(sku);
		if (!inventoryItem) return null;

		return {
			itemId: inventoryItem.id,
			sku: inventoryItem.sku,
			price: {
				currency: inventoryItem.priceCurrency,
				amountMinor: inventoryItem.priceAmountMinor,
			},
			availableQuantity: inventoryItem.availableQuantity,
			reservedQuantity: inventoryItem.reservedQuantity,
		};
	}

	async findRecentItems(limit: number): Promise<InventoryItemResult[]> {
		await this.inventoryItemRepository.seedIfEmpty();
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const inventoryItemRepository =
			await this.inventoryItemRepository.findAll(safeLimit);

		return inventoryItemRepository.map((inventoryItem) => ({
			itemId: inventoryItem.id,
			sku: inventoryItem.sku,
			price: {
				currency: inventoryItem.priceCurrency,
				amountMinor: inventoryItem.priceAmountMinor,
			},
			availableQuantity: inventoryItem.availableQuantity,
			reservedQuantity: inventoryItem.reservedQuantity,
		}));
	}

	async findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservationResult[]> {
		const inventoryReservations =
			await this.inventoryReservationRepository.findReservationsByOrderId(
				orderId,
			);

		return inventoryReservations.map((inventoryReservation) => ({
			reservationId: inventoryReservation.id,
			orderId: inventoryReservation.orderId,
			sku: inventoryReservation.sku,
			quantity: inventoryReservation.quantity,
		}));
	}
}

export const InventoryReaderProvider = {
	provide: IInventoryReaderSymbol,
	useClass: InventoryReader,
};
