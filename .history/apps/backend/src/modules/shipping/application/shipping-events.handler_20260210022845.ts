import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { CreateShipmentForOrderCommand } from './commands/create-shipment-for-order.command';

@Injectable()
export class ShippingEventsHandler {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    if (event.eventType !== 'SHIPPING.CREATE_FOR_ORDER') return;

    const orderId =
      typeof event.payload.orderId === 'string' ? event.payload.orderId : '';
    if (!orderId) throw new Error('invalid shipping payload');

    await this.commandBus.execute(new CreateShipmentForOrderCommand(orderId));
  }
}
