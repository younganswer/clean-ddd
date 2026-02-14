import { Inject, Injectable } from '@nestjs/common';

import {
  IInventoryReaderSymbol,
  type IInventoryReader,
} from '@/shared/readers/inventory/i.inventory.reader';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import type { InventoryReservationView } from '@/shared/readers/inventory/dto/inventory-reservation.view';
import { IInventoryRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '@/modules/inventory/domains/repositories/i.inventory.repository';

@Injectable()
export class InventoryReader implements IInventoryReader {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async findItemBySku(sku: string): Promise<InventoryItemView | null> {
    await this.inventory.seedIfEmpty();
    const i = await this.inventory.findBySku(sku);
    if (!i) return null;

    return {
      itemId: i.id,
      sku: i.sku,
      price: {
        currency: i.priceCurrency,
        amountMinor: i.priceAmountMinor,
      },
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }

  async findRecentItems(limit: number): Promise<InventoryItemView[]> {
    await this.inventory.seedIfEmpty();
    const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
    const list = await this.inventory.findAll(safeLimit);

    return list.map((i) => ({
      itemId: i.id,
      sku: i.sku,
      price: {
        currency: i.priceCurrency,
        amountMinor: i.priceAmountMinor,
      },
      availableQuantity: i.availableQuantity,
      reservedQuantity: i.reservedQuantity,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }));
  }

  async findReservationsByOrderId(
    orderId: string,
  ): Promise<InventoryReservationView[]> {
    const list = await this.inventory.findReservationsByOrderId(orderId);
    return list.map((r) => ({
      reservationId: r.id,
      orderId: r.orderId,
      sku: r.sku,
      quantity: r.quantity,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

export const InventoryReaderProvider = {
  provide: IInventoryReaderSymbol,
  useClass: InventoryReader,
};
