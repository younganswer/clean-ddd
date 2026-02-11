import { Body, Controller, Inject, InternalServerErrorException, NotFoundException, Param, Post } from '@nestjs/common';
import { OrderRepository } from '../../ordering/infrastructure/repositories/order.repository';
import { OutboxQueue } from '../../../shared/outbox/outbox.queue';
import { IOutboxRepositorySymbol } from '../../../shared/outbox/i.outbox.repository';
import type { IOutboxRepository } from '../../../shared/outbox/i.outbox.repository';
import { CreatePaymentIntentRequest } from './dto/create-payment-intent.request';
import { PaymentRepository } from '../infrastructure/repositories/payment.repository';

@Controller('orders/:orderId/payments')
export class PaymentsController {
  constructor(
    private readonly orders: OrderRepository,
    private readonly payments: PaymentRepository,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  @Post('intents')
  async createIntent(@Param('orderId') orderId: string, @Body() body: CreatePaymentIntentRequest) {
    try {
      const order = await this.orders.findById(orderId);
      if (!order) throw new NotFoundException('order not found');

      const payment = await this.payments.createIntent({
        orderId,
        amount: order.amount,
        currency: order.currency,
      });
      await this.orders.attachPayment(orderId, payment.uuid);

      const outcome = body.simulateOutcome ?? 'SUCCEEDED';
      const delaySeconds = Math.max(0, Number(body.simulateDelaySeconds ?? '10'));

      const outboxId = await this.outboxRepo.save({
        eventType: outcome === 'SUCCEEDED' ? 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED' : 'PAYMENT_WEBHOOK.PAYMENT_FAILED',
        payload: {
          orderId,
          paymentId: payment.uuid,
        },
      });

      const disableDelaySeconds = process.env.SQS_DISABLE_DELAY_SECONDS === 'true';
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
        paymentId: payment.uuid,
        status: payment.status,
        scheduled: {
          eventType: outcome === 'SUCCEEDED' ? 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED' : 'PAYMENT_WEBHOOK.PAYMENT_FAILED',
          delaySeconds,
          outboxId,
        },
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[PaymentsController.createIntent] failed', error);

      const message = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'development') {
        throw new InternalServerErrorException(message);
      }
      throw new InternalServerErrorException();
    }
  }
}
