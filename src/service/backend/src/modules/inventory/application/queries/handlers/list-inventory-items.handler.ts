import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import {
	GetInventoryItemsQuery,
	type InventoryItemResult,
} from '@/shared/inventory';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@QueryHandler(GetInventoryItemsQuery)
export class ListInventoryItemsHandler implements IQueryHandler<GetInventoryItemsQuery> {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItemRepository: IInventoryItemRepository,
	) {}

	async execute(
		query: GetInventoryItemsQuery,
	): Promise<PaginatedResult<InventoryItemResult>> {
		const { limit, offset } = query;
		await this.inventoryItemRepository.seedIfEmpty();
		const [rows, total] = await Promise.all([
			this.inventoryItemRepository.findAll(limit, offset),
			this.inventoryItemRepository.countItems(),
		]);

		const items = rows.map((inventoryItem) => ({
			itemId: inventoryItem.id,
			sku: inventoryItem.sku,
			price: {
				currency: inventoryItem.priceCurrency,
				amountMinor: inventoryItem.priceAmountMinor,
			},
			availableQuantity: inventoryItem.availableQuantity,
			reservedQuantity: inventoryItem.reservedQuantity,
		}));

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			offset,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
