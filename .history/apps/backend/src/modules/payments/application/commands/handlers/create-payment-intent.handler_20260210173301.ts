import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { OutboxQueue } from '../../../../../shared/outbox/infrastructure/queue/outbox.queue';
import { IOutboxRepositorySymbol } from '../../../../../shared/outbox/domain/i.outbox.repository';
import type { IOutboxRepository } from '../../../../../shared/outbox/domain/i.outbox.repository';
import { IPaymentRepositorySymbol } from '../../../domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../../../domains/repositories/i.payment.repository';
import { AttachPaymentToOrderCommand } from '../../../../ordering/application/commands/attach-payment-to-order.command';
import { GetOrderQuery } from '../../../../ordering/application/queries/get-order.query';
import {
  CreatePaymentIntentCommand,
  type CreatePaymentIntentResult,
} from '../create-payment-intent.command';

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
  constructor(
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: CreatePaymentIntentCommand,
  ): Promise<CreatePaymentIntentResult> {
    const orderId = String(command.input.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    const order = await this.queryBus.execute(new GetOrderQuery(orderId));
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

    const eventType =
      outcome === 'SUCCEEDED'
        ? 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED'
        : 'PAYMENT_WEBHOOK.PAYMENT_FAILED';

    const outboxId = await this.outboxRepo.save({
      eventType,
      payload: {
        orderId,
        paymentId: payment.id,
      },
    });

    const disableDelaySeconds =
      process.env.SQS_DISABLE_DELAY_SECONDS === 'true';
    if (disableDelaySeconds && delaySeconds > 0) {
      setTimeout(() => {
        void this.outboxQueue.enqueue(outboxId, {
          messageGroupId: orderId,
        });
      }, delaySeconds * 1000);
    } else {
      await this.outboxQueue.enqueue(outboxId, {
        delaySeconds,
        messageGroupId: orderId,
      });
    }

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
