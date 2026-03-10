import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import type { RepositoryPageOptions } from '@/lib/database/repository-get-options';

export interface IInventoryItemRepository {
	seedIfEmpty(): Promise<void>;
	persist(item: InventoryItem): Promise<void>;
	findRecent(
		options: RepositoryPageOptions<InventoryItem>,
	): Promise<InventoryItem[]>;
	findBySku(sku: string): Promise<InventoryItem | null>;
	countItems(): Promise<number>;
}

export const IInventoryItemRepositorySymbol = Symbol(
	'I_INVENTORY_ITEM_REPOSITORY',
);
