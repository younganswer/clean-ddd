import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';

export const IInventoryReaderSymbol = Symbol('IInventoryReader');

export interface IInventoryReader {
  findItemBySku(sku: string): Promise<InventoryItemView | null>;
  findRecentItems(limit: number): Promise<InventoryItemView[]>;
  findReservationsByOrderId(
    orderId: string,
  ): Promise<InventoryReservationView[]>;
}
