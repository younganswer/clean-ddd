import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domains/readers/i.inventory.reader';
import { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import { InventoryReservationResult } from '@/modules/inventory/domains/readers/inventory-reservation.result';
import { InventoryItemSchema } from '@/modules/inventory/infrastructure/schemas/inventory-item.schema';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';

@Injectable()
export class InventoryReader implements IInventoryReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async findItemBySku(sku: string): Promise<InventoryItemResult | null> {
		const inventoryItem = await this.emForContext().findOne(
			InventoryItemSchema,
			{ sku },
		);
		if (!inventoryItem) return null;

		return InventoryItemResult.fromSchema(inventoryItem);
	}

	async findRecentItems(
		limit: number,
		offset: number = 0,
	): Promise<InventoryItemResult[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const safeOffset = Math.max(0, Number(offset ?? 0) || 0);
		const items = await this.emForContext().find(
			InventoryItemSchema,
			{},
			{
				limit: safeLimit,
				offset: safeOffset,
				orderBy: { id: 'asc' },
			},
		);

		return items.map((inventoryItem) =>
			InventoryItemResult.fromSchema(inventoryItem),
		);
	}

	async findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservationResult[]> {
		const reservations = await this.emForContext().find(
			InventoryReservationSchema,
			{ orderId },
			{
				orderBy: { id: 'asc' },
			},
		);

		return reservations.map((reservation) =>
			InventoryReservationResult.fromSchema(reservation),
		);
	}

	async countItems(): Promise<number> {
		return await this.emForContext().count(InventoryItemSchema, {});
	}
}

export const InventoryReaderProvider = {
	provide: IInventoryReaderSymbol,
	useClass: InventoryReader,
};
