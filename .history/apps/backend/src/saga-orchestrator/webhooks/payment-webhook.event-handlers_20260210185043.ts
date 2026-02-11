import { Inject, Injectable } from '@nestjs/common';
import {
  CommandBus,
  EventsHandler,
  IEventHandler,
  QueryBus,
} from '@nestjs/cqrs';
import {
  PaymentWebhookFailedEvent,
  PaymentWebhookSucceededEvent,
} from '../../shared/payments';
import { IPaymentRepositorySymbol } from '../../modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../../modules/payments/domains/repositories/i.payment.repository';
import { MarkOrderPaidCommand } from '../../modules/ordering/application/commands/mark-order-paid.command';
import { GetOrderQuery, type OrderView } from '../../shared/ordering';
import { OutboxProducer } from '../../shared/outbox/application/outbox.producer';
import { ReserveInventoryForOrderRequestedEvent } from '../../shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '../../shared/shipping';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly outbox: OutboxProducer,
  ) {}

  async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
    const orderId = String(event.orderId ?? '').trim();
    const paymentId = String(event.paymentId ?? '').trim();
    if (!orderId || !paymentId) throw new Error('invalid webhook payload');

    await this.payments.markSucceeded(paymentId);
    await this.commandBus.execute(new MarkOrderPaidCommand(orderId));

    const order = (await this.queryBus.execute(
      new GetOrderQuery(orderId) as unknown as never,
    )) as OrderView | null;

    const items = order?.items?.length
      ? order.items
      : [{ sku: 'SKU-001', quantity: 1 }];

    await this.outbox.publish(
      new ReserveInventoryForOrderRequestedEvent(orderId, items),
      { messageGroupId: orderId },
    );

    await this.outbox.publish(
      new CreateShipmentForOrderRequestedEvent(orderId),
      {
        messageGroupId: orderId,
      },
    );
  }
}

@Injectable()
@EventsHandler(PaymentWebhookFailedEvent)
export class PaymentWebhookFailedHandler implements IEventHandler<PaymentWebhookFailedEvent> {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
  ) {}

  async handle(event: PaymentWebhookFailedEvent): Promise<void> {
    const paymentId = String(event.paymentId ?? '').trim();
    if (!paymentId) throw new Error('invalid webhook payload');
    await this.payments.markFailed(paymentId);
  }
}
