import { Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import type { InventoryOrderItem } from '../domains/inventory-item';
import { InventoryRepository } from '../infrastructure/repositories/inventory.repository';

@Injectable()
export class InventoryEventsHandler {
  constructor(private readonly inventory: InventoryRepository) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    if (event.eventType !== 'INVENTORY.RESERVE_FOR_ORDER') return;

    const orderId = String(event.payload.orderId ?? '');
    const items = (event.payload.items ?? []) as InventoryOrderItem[];

    if (!orderId) throw new Error('invalid inventory payload');

    await this.inventory.seedIfEmpty();
    await this.inventory.reserveForOrder(orderId, items);
  }
}
