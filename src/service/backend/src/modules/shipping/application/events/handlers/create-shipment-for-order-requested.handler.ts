import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { SHIPPING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@EventsHandler(CreateShipmentForOrderRequestedEvent)
export class CreateShipmentForOrderRequestedHandler implements IEventHandler<CreateShipmentForOrderRequestedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: CreateShipmentForOrderRequestedEvent): Promise<void> {
		const orderId = String(event.orderId ?? '').trim();
		if (!orderId) {
			throw ApplicationErrorFactory.create(
				SHIPPING_APPLICATION_ERRORS.SHIPPING_EVENT_PAYLOAD_INVALID,
				{
					details: { reason: 'orderId' },
				},
			);
		}

		await this.commandBus.execute(
			new CreateShipmentForOrderCommand(orderId),
		);
	}
}
