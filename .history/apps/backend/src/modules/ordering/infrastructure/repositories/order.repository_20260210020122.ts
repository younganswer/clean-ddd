import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IOrderRepository } from '../../domains/repositories/i.order.repository';
import { OrderStatus } from '../../domains/order-status';
import { Order } from '../../domains/entities/aggregates/order/order.aggregate';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderSchema } from '../schemas/order.schema';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly mapper: OrderMapper,
  ) {}

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
  }): Promise<Order> {
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
    return this.mapper.toDomain(order);
  }

  async findById(orderId: string): Promise<Order | null> {
    const em = this.emForContext();
    const found = await em.findOne(OrderSchema, { uuid: orderId });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findRecent(limit: number): Promise<Order[]> {
    const em = this.emForContext();
    const found = await em.find(
      OrderSchema,
      {},
      {
        limit,
        orderBy: { createdAt: 'desc' },
      },
    );
    return found.map((o) => this.mapper.toDomain(o));
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
