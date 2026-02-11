import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../domains/order-status';
import { OrderSchema } from '../schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async create(input: {
    amount: number;
    currency: string;
    items?: Array<{ sku: string; quantity: number }>;
  }): Promise<OrderSchema> {
    const em = this.emForContext();
    const order = em.create(OrderSchema, {
      amount: input.amount,
      currency: input.currency,
      items: input.items?.length ? input.items : [{ sku: 'SKU-001', quantity: 1 }],
      status: OrderStatus.PENDING_PAYMENT,
      paymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await em.persistAndFlush(order);
    return order;
  }

  async findById(orderId: string): Promise<OrderSchema | null> {
    const em = this.emForContext();
    return em.findOne(OrderSchema, { uuid: orderId });
  }

  async findRecent(limit: number): Promise<OrderSchema[]> {
    const em = this.emForContext();
    return em.find(
      OrderSchema,
      {},
      {
        limit,
        orderBy: { createdAt: 'desc' },
      },
    );
  }

  async attachPayment(orderId: string, paymentId: string): Promise<void> {
    const em = this.emForContext();
    const order = await em.findOneOrFail(OrderSchema, { uuid: orderId });
    order.paymentId = paymentId;
    order.updatedAt = new Date();
    await em.persistAndFlush(order);
  }

  async markPaid(orderId: string): Promise<void> {
    const em = this.emForContext();
    const order = await em.findOneOrFail(OrderSchema, { uuid: orderId });
    order.status = OrderStatus.PAID;
    order.updatedAt = new Date();
    await em.persistAndFlush(order);
  }
}
