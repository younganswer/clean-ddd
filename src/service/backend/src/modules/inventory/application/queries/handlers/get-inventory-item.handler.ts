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
		private readonly inventoryItemRepository: IInventoryItemRepository,
	) {}

	async execute(
		query: GetInventoryItemQuery,
	): Promise<InventoryItemView | null> {
		await this.inventoryItemRepository.seedIfEmpty();
		const inventoryItem = await this.inventoryItemRepository.findBySku(
			query.sku,
		);
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
}
