import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInventoryItemsQuery } from '@/modules/inventory/application/queries/get-inventory-items.query';
import type { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domains/readers/i.inventory.reader';

@QueryHandler(GetInventoryItemsQuery)
export class ListInventoryItemsHandler implements IQueryHandler<GetInventoryItemsQuery> {
	constructor(
		@Inject(IInventoryReaderSymbol)
		private readonly inventoryReader: IInventoryReader,
	) {}

	async execute(
		query: GetInventoryItemsQuery,
	): Promise<PaginatedResult<InventoryItemResult>> {
		const { limit, offset } = query;
		const [rows, total] = await Promise.all([
			this.inventoryReader.findRecentItems(limit, offset),
			this.inventoryReader.countItems(),
		]);
		const items = rows;

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
