import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { OutboxProducer } from '../../../../../shared/outbox/application/outbox.producer';
import { IPaymentRepositorySymbol } from '../../../domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../../../domains/repositories/i.payment.repository';
import { AttachPaymentToOrderCommand } from '../../../../ordering/application/commands/attach-payment-to-order.command';
import { GetOrderQuery } from '../../../../ordering/application/queries/get-order.query';
import {
  PaymentWebhookFailedEvent,
  PaymentWebhookSucceededEvent,
} from '../../../../../shared/payments';
import type { OrderView } from '../../../../../shared/ordering';
import {
  CreatePaymentIntentCommand,
  type CreatePaymentIntentResult,
} from '../create-payment-intent.command';

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
    private readonly outbox: OutboxProducer,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: CreatePaymentIntentCommand,
  ): Promise<CreatePaymentIntentResult> {
    const orderId = String(command.input.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    const order = (await this.queryBus.execute(
      new GetOrderQuery(orderId) as unknown as never,
    )) as OrderView | null;
    if (!order) {
      throw new Error('order not found');
    }

    const payment = await this.payments.createIntent({
      orderId,
      amount: order.amount,
      currency: order.currency,
    });

    await this.commandBus.execute(
      new AttachPaymentToOrderCommand({ orderId, paymentId: payment.id }),
    );

    const outcome = command.input.simulateOutcome ?? 'SUCCEEDED';
    const delaySeconds = Math.max(
      0,
      Number(command.input.simulateDelaySeconds ?? 10),
    );

    const event =
      outcome === 'SUCCEEDED'
        ? new PaymentWebhookSucceededEvent(orderId, payment.id)
        : new PaymentWebhookFailedEvent(orderId, payment.id);

    const outboxId = await this.outbox.publish(event, {
      delaySeconds,
      messageGroupId: orderId,
    });

    const eventType =
      outcome === 'SUCCEEDED'
        ? PaymentWebhookSucceededEvent.eventType
        : PaymentWebhookFailedEvent.eventType;

    return {
      paymentId: payment.id,
      status: payment.status,
      scheduled: {
        eventType,
        delaySeconds,
        outboxId,
      },
    };
  }
}
