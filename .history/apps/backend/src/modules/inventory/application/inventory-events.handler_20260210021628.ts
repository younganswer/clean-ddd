import { Inject, Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import type { InventoryOrderItem } from '../domains/inventory-item';
import { IInventoryRepositorySymbol } from '../domains/repositories/i.inventory.repository';
import type { IInventoryRepository } from '../domains/repositories/i.inventory.repository';

@Injectable()
export class InventoryEventsHandler {
  constructor(
    @Inject(IInventoryRepositorySymbol)
    private readonly inventory: IInventoryRepository,
  ) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    if (event.eventType !== 'INVENTORY.RESERVE_FOR_ORDER') return;

    const payload = event.payload;
    const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';

    const rawItems = payload.items;
    const items: InventoryOrderItem[] = Array.isArray(rawItems)
      ? rawItems
          .map((i) => {
            if (!i || typeof i !== 'object') return null;
            const rec = i as Record<string, unknown>;
            const sku = typeof rec.sku === 'string' ? rec.sku : '';
            const quantity = typeof rec.quantity === 'number' ? rec.quantity : 0;
            if (!sku || !Number.isFinite(quantity) || quantity <= 0) return null;
            return { sku, quantity } satisfies InventoryOrderItem;
          })
          .filter((x): x is InventoryOrderItem => x !== null)
      : [];

    if (!orderId) throw new Error('invalid inventory payload');

    await this.inventory.seedIfEmpty();
    await this.inventory.reserveForOrder(orderId, items);
  }
}
