import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import type { InventoryOrderItem } from '@/modules/inventory/domains/inventory-item';

@EventsHandler(ReserveInventoryForOrderRequestedEvent)
export class ReserveInventoryForOrderRequestedHandler implements IEventHandler<ReserveInventoryForOrderRequestedEvent> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: ReserveInventoryForOrderRequestedEvent): Promise<void> {
    const orderId = String(event.orderId ?? '').trim();
    if (!orderId) throw new Error('invalid inventory payload');

    const items: InventoryOrderItem[] = Array.isArray(event.items)
      ? event.items
          .map((i) => ({
            sku: String(i?.sku ?? '').trim(),
            quantity: Number(i?.quantity ?? 0),
          }))
          .filter((i) => i.sku && Number.isFinite(i.quantity) && i.quantity > 0)
      : [];

    await this.commandBus.execute(
      new ReserveInventoryForOrderCommand({ orderId, items }),
    );
  }
}
