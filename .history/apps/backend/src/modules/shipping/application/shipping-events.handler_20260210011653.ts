import { Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { ShipmentRepository } from '../infrastructure/repositories/shipment.repository';

@Injectable()
export class ShippingEventsHandler {
  constructor(private readonly shipments: ShipmentRepository) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    if (event.eventType !== 'SHIPPING.CREATE_FOR_ORDER') return;

    const orderId = String(event.payload.orderId ?? '');
    if (!orderId) throw new Error('invalid shipping payload');

    await this.shipments.createForOrder(orderId);
  }
}
