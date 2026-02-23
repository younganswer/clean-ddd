import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@/shared/payments';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentMapper } from '@/modules/payments/infrastructure/mappers/payment-intent.mapper';
import { PaymentIntentSchema } from '@/modules/payments/infrastructure/schemas/payment-intent.schema';

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

  createIntent(input: {
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
    em.persist(payment);
    return Promise.resolve(this.mapper.toDomain(payment));
  }

  async findById(paymentId: string): Promise<PaymentIntent | null> {
    const em = this.emForContext();
    const found = await em.findOne(PaymentIntentSchema, { uuid: paymentId });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findRecent(limit: number): Promise<PaymentIntent[]> {
    const em = this.emForContext();
    const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
    const found = await em.find(
      PaymentIntentSchema,
      {},
      {
        orderBy: { id: 'asc' },
        limit: safeLimit,
      },
    );
    return found.map((p) => this.mapper.toDomain(p));
  }

  async markSucceeded(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, {
      uuid: paymentId,
    });
    payment.status = PaymentStatus.SUCCEEDED;
    payment.updatedAt = new Date();
    em.persist(payment);
  }

  async markFailed(paymentId: string): Promise<void> {
    const em = this.emForContext();
    const payment = await em.findOneOrFail(PaymentIntentSchema, {
      uuid: paymentId,
    });
    payment.status = PaymentStatus.FAILED;
    payment.updatedAt = new Date();
    em.persist(payment);
  }
}
