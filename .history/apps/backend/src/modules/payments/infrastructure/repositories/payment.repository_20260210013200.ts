import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../domains/payment-status';
import { PaymentIntentSchema } from '../schemas/payment-intent.schema';

@Injectable()
export class PaymentRepository {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async createIntent(input: { orderId: string; amount: number; currency: string }): Promise<PaymentIntentSchema> {
    const em = this.emForContext();
    const payment = em.create(PaymentIntentSchema, {
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await em.persistAndFlush(payment);
    return payment;
  }

  async markSucceeded(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, { uuid: paymentId });
    payment.status = PaymentStatus.SUCCEEDED;
    payment.updatedAt = new Date();
    await em.persistAndFlush(payment);
  }

  async markFailed(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, { uuid: paymentId });
    payment.status = PaymentStatus.FAILED;
    payment.updatedAt = new Date();
    await em.persistAndFlush(payment);
  }
}
