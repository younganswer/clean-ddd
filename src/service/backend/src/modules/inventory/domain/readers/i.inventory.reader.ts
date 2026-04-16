import type { PageOptions } from '@/lib/database/repository-get-options';
import type { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import type { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';

export const IInventoryReaderSymbol = Symbol('IInventoryReader');

export interface IInventoryReader {
	findItemBySku(sku: string): Promise<InventoryItemResult | null>;
	findRecentItems(
		options: PageOptions<InventoryItemResult>,
	): Promise<InventoryItemResult[]>;
	findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservationResult[]>;
	countItems(): Promise<number>;
}
