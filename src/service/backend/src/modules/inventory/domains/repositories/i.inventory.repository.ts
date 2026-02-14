import type { InventoryOrderItem } from '@/modules/inventory/domains/inventory-item';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';

export interface IInventoryRepository {
  seedIfEmpty(): Promise<void>;

  findAll(limit: number, offset?: number): Promise<InventoryItem[]>;
  countItems(): Promise<number>;
  findBySku(sku: string): Promise<InventoryItem | null>;

  reserveForOrder(orderId: string, items: InventoryOrderItem[]): Promise<void>;

  findReservationsByOrderId(orderId: string): Promise<InventoryReservation[]>;
}

export const IInventoryRepositorySymbol = Symbol('I_INVENTORY_REPOSITORY');
