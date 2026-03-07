import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedEvent } from '@/contracts/inventory';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { OutboxKnownHandler } from '@/common/outbox/outbox-known-handler.decorator';

@EventsHandler(ReserveInventoryForOrderRequestedEvent)
@OutboxKnownHandler(ReserveInventoryForOrderRequestedEvent.eventType)
export class ReserveInventoryForOrderRequestedHandler implements IEventHandler<ReserveInventoryForOrderRequestedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: ReserveInventoryForOrderRequestedEvent): Promise<void> {
		await this.commandBus.execute(
			new ReserveInventoryForOrderCommand({
				orderId: event.orderId,
				items: event.items,
			}),
		);
	}
}
