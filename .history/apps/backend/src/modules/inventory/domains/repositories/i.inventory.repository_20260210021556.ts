import type { InventoryOrderItem } from '../inventory-item';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryReservation } from '../entities/inventory-reservation.entity';

export interface IInventoryRepository {
  seedIfEmpty(): Promise<void>;

  findAll(limit: number): Promise<InventoryItem[]>;
  findBySku(sku: string): Promise<InventoryItem | null>;

  reserveForOrder(orderId: string, items: InventoryOrderItem[]): Promise<void>;

  findReservationsByOrderId(orderId: string): Promise<InventoryReservation[]>;
}

export const IInventoryRepositorySymbol = Symbol('I_INVENTORY_REPOSITORY');
