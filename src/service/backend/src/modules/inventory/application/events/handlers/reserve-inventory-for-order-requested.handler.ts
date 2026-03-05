import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { OutboxKnownHandler } from '@/modules/outbox/application/outbox-known-handler.decorator';

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
