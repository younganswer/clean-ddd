import { Injectable, Logger } from '@nestjs/common';
import { PaymentsWebhookHandler } from '../../modules/payments/application/payments-webhook.handler';

export interface RoutedOutboxEvent {
  outboxId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxRouter {
  private readonly logger = new Logger(OutboxRouter.name);

  constructor(private readonly paymentsWebhook: PaymentsWebhookHandler) {}

  async route(event: RoutedOutboxEvent): Promise<void> {
    switch (event.eventType) {
      case 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED':
      case 'PAYMENT_WEBHOOK.PAYMENT_FAILED':
        await this.paymentsWebhook.handle(event);
        return;
      default:
        this.logger.warn(`no handler for eventType=${event.eventType}`);
        return;
    }
  }
}
