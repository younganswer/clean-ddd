import { Inject, Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { IShipmentRepositorySymbol } from '../domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '../domains/repositories/i.shipment.repository';

@Injectable()
export class ShippingEventsHandler {
  constructor(
    @Inject(IShipmentRepositorySymbol)
    private readonly shipments: IShipmentRepository,
  ) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    if (event.eventType !== 'SHIPPING.CREATE_FOR_ORDER') return;

    const orderId =
      typeof event.payload.orderId === 'string' ? event.payload.orderId : '';
    if (!orderId) throw new Error('invalid shipping payload');

    await this.shipments.createForOrder(orderId);
  }
}
