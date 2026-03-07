import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetInventoryItemsQuery,
	type InventoryItemResult,
} from '@/shared/inventory';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/shared/readers/inventory/i.inventory.reader';

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
