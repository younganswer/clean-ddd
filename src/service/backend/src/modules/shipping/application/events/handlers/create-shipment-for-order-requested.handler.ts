import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderRequestedEvent } from '@/contracts/shipping/events/create-shipment-for-order-requested.event';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';

@EventsHandler(CreateShipmentForOrderRequestedEvent)
@OutboxKnownHandler(CreateShipmentForOrderRequestedEvent.eventType)
export class CreateShipmentForOrderRequestedHandler implements IEventHandler<CreateShipmentForOrderRequestedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: CreateShipmentForOrderRequestedEvent): Promise<void> {
		const command = new CreateShipmentForOrderCommand({
			orderId: event.orderId,
		});
		await this.commandBus.execute(command);
	}
}
