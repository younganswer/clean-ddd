import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import {
	ListInventoryItemsQuery,
	type InventoryItemView,
} from '@/shared/inventory';
import type { PaginatedView } from '@/shared/readers/paginated.view';

@QueryHandler(ListInventoryItemsQuery)
export class ListInventoryItemsHandler implements IQueryHandler<ListInventoryItemsQuery> {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItems: IInventoryItemRepository,
	) {}

	async execute(
		query: ListInventoryItemsQuery,
	): Promise<PaginatedView<InventoryItemView>> {
		const limit = Math.min(
			200,
			Math.max(1, Number(query.limit ?? 50) || 50),
		);
		const page = Math.max(1, Number(query.page ?? 1) || 1);
		const offset = (page - 1) * limit;
		await this.inventoryItems.seedIfEmpty();
		const [rows, total] = await Promise.all([
			this.inventoryItems.findAll(limit, offset),
			this.inventoryItems.countItems(),
		]);

		const items = rows.map((i) => ({
			itemId: i.uuid,
			sku: i.sku,
			price: {
				currency: i.priceCurrency,
				amountMinor: i.priceAmountMinor,
			},
			availableQuantity: i.availableQuantity,
			reservedQuantity: i.reservedQuantity,
		}));

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			page,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
