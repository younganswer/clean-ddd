import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';

@EventsHandler(CreateShipmentForOrderRequestedEvent)
export class CreateShipmentForOrderRequestedHandler implements IEventHandler<CreateShipmentForOrderRequestedEvent> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: CreateShipmentForOrderRequestedEvent): Promise<void> {
    const orderId = String(event.orderId ?? '').trim();
    if (!orderId) throw new Error('invalid shipping payload');

    await this.commandBus.execute(new CreateShipmentForOrderCommand(orderId));
  }
}
