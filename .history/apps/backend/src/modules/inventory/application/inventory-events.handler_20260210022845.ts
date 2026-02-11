import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import type { InventoryOrderItem } from '../domains/inventory-item';
import { ReserveInventoryForOrderCommand } from './commands/reserve-inventory-for-order.command';

@Injectable()
export class InventoryEventsHandler {
  constructor(private readonly commandBus: CommandBus) {}

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
            const quantity =
              typeof rec.quantity === 'number' ? rec.quantity : 0;
            if (!sku || !Number.isFinite(quantity) || quantity <= 0)
              return null;
            return { sku, quantity } satisfies InventoryOrderItem;
          })
          .filter((x): x is InventoryOrderItem => x !== null)
      : [];

    if (!orderId) throw new Error('invalid inventory payload');

    await this.commandBus.execute(
      new ReserveInventoryForOrderCommand({ orderId, items }),
    );
  }
}
