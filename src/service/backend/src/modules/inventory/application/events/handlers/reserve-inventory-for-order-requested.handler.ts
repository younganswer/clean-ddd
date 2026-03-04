import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReserveInventoryForOrderRequestedEvent } from '@/shared/inventory';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';

@EventsHandler(ReserveInventoryForOrderRequestedEvent)
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
