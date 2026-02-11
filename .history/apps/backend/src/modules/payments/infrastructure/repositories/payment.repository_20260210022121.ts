import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../../domains/payment-status';
import type { IPaymentRepository } from '../../domains/repositories/i.payment.repository';
import { PaymentIntent } from '../../domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentMapper } from '../mappers/payment-intent.mapper';
import { PaymentIntentSchema } from '../schemas/payment-intent.schema';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly mapper: PaymentIntentMapper,
  ) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async createIntent(input: {
    orderId: string;
    amount: number;
    currency: string;
  }): Promise<PaymentIntent> {
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
    return this.mapper.toDomain(payment);
  }

  async findById(paymentId: string): Promise<PaymentIntent | null> {
    const em = this.emForContext();
    const found = await em.findOne(PaymentIntentSchema, { uuid: paymentId });
    return found ? this.mapper.toDomain(found) : null;
  }

  async markSucceeded(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, {
      uuid: paymentId,
    });
    payment.status = PaymentStatus.SUCCEEDED;
    payment.updatedAt = new Date();
    await em.persistAndFlush(payment);
  }

  async markFailed(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, {
      uuid: paymentId,
    });
    payment.status = PaymentStatus.FAILED;
    payment.updatedAt = new Date();
    await em.persistAndFlush(payment);
  }
}
