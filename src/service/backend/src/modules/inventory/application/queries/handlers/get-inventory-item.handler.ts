import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetInventoryItemQuery,
	type InventoryItemResult,
} from '@/shared/inventory';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/shared/inventory/readers/i.inventory.reader';

@QueryHandler(GetInventoryItemQuery)
export class GetInventoryItemHandler implements IQueryHandler<GetInventoryItemQuery> {
	constructor(
		@Inject(IInventoryReaderSymbol)
		private readonly inventoryReader: IInventoryReader,
	) {}

	async execute(
		query: GetInventoryItemQuery,
	): Promise<InventoryItemResult | null> {
		return await this.inventoryReader.findItemBySku(query.sku);
	}
}
