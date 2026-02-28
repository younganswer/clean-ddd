import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import type { InventoryOrderItem } from '@/modules/inventory/domains/inventory-item';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@EventsHandler(ReserveInventoryForOrderRequestedEvent)
export class ReserveInventoryForOrderRequestedHandler implements IEventHandler<ReserveInventoryForOrderRequestedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: ReserveInventoryForOrderRequestedEvent): Promise<void> {
		const orderId = String(event.orderId ?? '').trim();
		if (!orderId) {
			throw ApplicationErrorFactory.create(
				INVENTORY_APPLICATION_ERRORS.INVENTORY_EVENT_PAYLOAD_INVALID,
				{
					details: { reason: 'orderId' },
				},
			);
		}
		if (!Array.isArray(event.items) || event.items.length === 0) {
			throw ApplicationErrorFactory.create(
				INVENTORY_APPLICATION_ERRORS.INVENTORY_EVENT_PAYLOAD_INVALID,
				{
					details: { reason: 'items' },
				},
			);
		}

		const items: InventoryOrderItem[] = event.items.map((i) => ({
			sku: String(i?.sku ?? '').trim(),
			quantity: Number(i?.quantity ?? 0),
		}));

		await this.commandBus.execute(
			new ReserveInventoryForOrderCommand({ orderId, items }),
		);
	}
}
