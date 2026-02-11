import { Injectable, Logger } from '@nestjs/common';
import { PaymentsWebhookHandler } from '../../modules/payments/application/payments-webhook.handler';
import { ShippingEventsHandler } from '../../modules/shipping/application/shipping-events.handler';
import { InventoryEventsHandler } from '../../modules/inventory/application/inventory-events.handler';

export interface RoutedOutboxEvent {
  outboxId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxRouter {
  private readonly logger = new Logger(OutboxRouter.name);

  constructor(
    private readonly paymentsWebhook: PaymentsWebhookHandler,
    private readonly shipping: ShippingEventsHandler,
    private readonly inventory: InventoryEventsHandler,
  ) {}

  async route(event: RoutedOutboxEvent): Promise<void> {
    switch (event.eventType) {
      case 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED':
      case 'PAYMENT_WEBHOOK.PAYMENT_FAILED':
        await this.paymentsWebhook.handle(event);
        return;
      case 'SHIPPING.CREATE_FOR_ORDER':
        await this.shipping.handle(event);
        return;
      case 'INVENTORY.RESERVE_FOR_ORDER':
        await this.inventory.handle(event);
        return;
      default:
        this.logger.warn(`no handler for eventType=${event.eventType}`);
        return;
    }
  }
}
