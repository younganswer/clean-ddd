import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryItemRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import {
	GetInventoryItemQuery,
	type InventoryItemView,
} from '@/shared/inventory';

@QueryHandler(GetInventoryItemQuery)
export class GetInventoryItemHandler implements IQueryHandler<GetInventoryItemQuery> {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItems: IInventoryItemRepository,
	) {}

	async execute(
		query: GetInventoryItemQuery,
	): Promise<InventoryItemView | null> {
		await this.inventoryItems.seedIfEmpty();
		const i = await this.inventoryItems.findBySku(query.sku);
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
}
