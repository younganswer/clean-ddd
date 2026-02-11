import { Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { OutboxProducer } from '../../../shared/outbox/outbox.producer';
import { Inject } from '@nestjs/common';
import { IOrderRepositorySymbol } from '../../ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '../../ordering/domains/repositories/i.order.repository';
import { PaymentRepository } from '../infrastructure/repositories/payment.repository';

@Injectable()
export class PaymentsWebhookHandler {
  constructor(
    private readonly payments: PaymentRepository,
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
    private readonly outbox: OutboxProducer,
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

      const order = await this.orders.findById(orderId);
      const items = (order?.items ?? [{ sku: 'SKU-001', quantity: 1 }]) as any;

      await this.outbox.emit('INVENTORY.RESERVE_FOR_ORDER', {
        orderId,
        items,
      });

      await this.outbox.emit('SHIPPING.CREATE_FOR_ORDER', {
        orderId,
      });
      return;
    }

    if (event.eventType === 'PAYMENT_WEBHOOK.PAYMENT_FAILED') {
      await this.payments.markFailed(paymentId);
      return;
    }
  }
}
