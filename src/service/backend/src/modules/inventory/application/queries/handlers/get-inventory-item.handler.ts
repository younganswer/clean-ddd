import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInventoryItemQuery } from '@/modules/inventory/application/queries/get-inventory-item.query';
import type { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domains/readers/i.inventory.reader';

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
