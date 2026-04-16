import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domain/readers/i.inventory.reader';
import type { PageOptions } from '@/lib/database/repository-get-options';
import { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';
import { InventoryItemSchema } from '@/modules/inventory/infrastructure/schemas/inventory-item.schema';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';
import { normalizeReaderExternalPage } from '@/common/cqrs/pagination-policy';
import { useClassProvider } from '@/common/utils/nest-provider.helpers';

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
		options: PageOptions<InventoryItemResult>,
	): Promise<InventoryItemResult[]> {
		const page = normalizeReaderExternalPage(options.limit, options.offset);
		const items = await this.emForContext().find(
			InventoryItemSchema,
			{},
			{
				limit: page.limit,
				offset: page.offset,
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

export const InventoryReaderProvider = useClassProvider(
	IInventoryReaderSymbol,
	InventoryReader,
);
