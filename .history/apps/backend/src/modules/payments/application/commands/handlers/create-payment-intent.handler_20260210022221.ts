import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from '../../../../ordering/domains/repositories/i.order.repository';
import type { IOrderRepository } from '../../../../ordering/domains/repositories/i.order.repository';
import { OutboxQueue } from '../../../../../shared/outbox/outbox.queue';
import { IOutboxRepositorySymbol } from '../../../../../shared/outbox/i.outbox.repository';
import type { IOutboxRepository } from '../../../../../shared/outbox/i.outbox.repository';
import { IPaymentRepositorySymbol } from '../../../domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '../../../domains/repositories/i.payment.repository';
import {
  CreatePaymentIntentCommand,
  type CreatePaymentIntentResult,
} from '../create-payment-intent.command';

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler
  implements ICommandHandler<CreatePaymentIntentCommand> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
    @Inject(IPaymentRepositorySymbol)
    private readonly payments: IPaymentRepository,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  async execute(
    command: CreatePaymentIntentCommand,
  ): Promise<CreatePaymentIntentResult> {
    const orderId = String(command.input.orderId ?? '').trim();
    if (!orderId) throw new Error('orderId is required');

    const order = await this.orders.findById(orderId);
    if (!order) {
      throw new Error('order not found');
    }

    const payment = await this.payments.createIntent({
      orderId,
      amount: order.amount,
      currency: order.currency,
    });

    await this.orders.attachPayment(orderId, payment.id);

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
