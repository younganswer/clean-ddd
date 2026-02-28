import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';

export interface IInventoryItemRepository {
	seedIfEmpty(): Promise<void>;
	persist(item: InventoryItem): Promise<void>;
	findAll(limit: number, offset?: number): Promise<InventoryItem[]>;
	findBySku(sku: string): Promise<InventoryItem | null>;
	countItems(): Promise<number>;
}

export const IInventoryItemRepositorySymbol = Symbol(
	'I_INVENTORY_ITEM_REPOSITORY',
);
