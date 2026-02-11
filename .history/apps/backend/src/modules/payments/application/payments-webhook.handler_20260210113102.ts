import { Injectable } from '@nestjs/common';
import type { RoutedOutboxEvent } from '../../../shared/outbox/outbox.router';
import { OutboxProducer } from '../../../shared/outbox/outbox.producer';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { MarkOrderPaidCommand } from '../../ordering/application/commands/mark-order-paid.command';
import { GetOrderQuery } from '../../ordering/application/queries/get-order.query';
import { Inject } from '@nestjs/common';
import { IPaymentRepositorySymbol } from '../domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../domains/repositories/i.payment.repository';

@Injectable()
export class PaymentsWebhookHandler {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly outbox: OutboxProducer,
  ) {}

  async handle(event: RoutedOutboxEvent): Promise<void> {
    const payload = event.payload;
    const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';
    const paymentId =
      typeof payload.paymentId === 'string' ? payload.paymentId : '';
    if (!orderId || !paymentId) {
      throw new Error('invalid webhook payload');
    }

    if (event.eventType === 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED') {
      await this.payments.markSucceeded(paymentId);
      await this.commandBus.execute(new MarkOrderPaidCommand(orderId));

      const order = await this.queryBus.execute(new GetOrderQuery(orderId));
      const items = order?.items?.length
        ? order.items
        : [{ sku: 'SKU-001', quantity: 1 }];

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
