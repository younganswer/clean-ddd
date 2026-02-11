import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../domains/payment-status';
import { PaymentIntentSchema } from '../schemas/payment-intent.schema';

@Injectable()
export class PaymentRepository {
  constructor(private readonly em: EntityManager) {}

  async createIntent(input: { orderId: string; amount: number; currency: string }): Promise<PaymentIntentSchema> {
    const payment = this.em.create(PaymentIntentSchema, {
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(payment);
    return payment;
  }

  async markSucceeded(paymentId: string): Promise<void> {
    const payment = await this.em.findOneOrFail(PaymentIntentSchema, { uuid: paymentId });
    payment.status = PaymentStatus.SUCCEEDED;
    payment.updatedAt = new Date();
    await this.em.persistAndFlush(payment);
  }

  async markFailed(paymentId: string): Promise<void> {
    const payment = await this.em.findOneOrFail(PaymentIntentSchema, { uuid: paymentId });
    payment.status = PaymentStatus.FAILED;
    payment.updatedAt = new Date();
    await this.em.persistAndFlush(payment);
  }
}
