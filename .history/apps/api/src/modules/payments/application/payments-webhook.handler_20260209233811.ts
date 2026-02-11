import { Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { OrderRepository } from '../../ordering/infrastructure/repositories/order.repository';
import { PaymentRepository } from '../infrastructure/repositories/payment.repository';

@Injectable()
export class PaymentsWebhookHandler {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly orders: OrderRepository,
  ) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    const orderId = String(event.payload.orderId ?? '');
    const paymentId = String(event.payload.paymentId ?? '');
    if (!orderId || !paymentId) {
      throw new Error('invalid webhook payload');
    }

    if (event.eventType === 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED') {
      await this.payments.markSucceeded(paymentId);
      await this.orders.markPaid(orderId);
      return;
    }

    if (event.eventType === 'PAYMENT_WEBHOOK.PAYMENT_FAILED') {
      await this.payments.markFailed(paymentId);
      return;
    }
  }
}
