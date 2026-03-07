import type { InventoryItemResult } from '@/shared/inventory/readers/dto/inventory-item.result';
import type { InventoryReservationResult } from '@/shared/inventory/readers/dto/inventory-reservation.result';

export const IInventoryReaderSymbol = Symbol('IInventoryReader');

export interface IInventoryReader {
	findItemBySku(sku: string): Promise<InventoryItemResult | null>;
	findRecentItems(
		limit: number,
		offset?: number,
	): Promise<InventoryItemResult[]>;
	findReservationsByOrderId(
		orderId: string,
	): Promise<InventoryReservationResult[]>;
	countItems(): Promise<number>;
}
