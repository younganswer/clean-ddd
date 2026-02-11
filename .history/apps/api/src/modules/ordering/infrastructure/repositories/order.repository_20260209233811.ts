import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../../domains/order-status';
import { OrderSchema } from '../schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(private readonly em: EntityManager) {}

  async create(input: { amount: number; currency: string }): Promise<OrderSchema> {
    const order = this.em.create(OrderSchema, {
      amount: input.amount,
      currency: input.currency,
      status: OrderStatus.PENDING_PAYMENT,
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(order);
    return order;
  }

  async findById(orderId: string): Promise<OrderSchema | null> {
    return this.em.findOne(OrderSchema, { uuid: orderId });
  }

  async attachPayment(orderId: string, paymentId: string): Promise<void> {
    const order = await this.em.findOneOrFail(OrderSchema, { uuid: orderId });
    order.paymentId = paymentId;
    order.updatedAt = new Date();
    await this.em.persistAndFlush(order);
  }

  async markPaid(orderId: string): Promise<void> {
    const order = await this.em.findOneOrFail(OrderSchema, { uuid: orderId });
    order.status = OrderStatus.PAID;
    order.updatedAt = new Date();
    await this.em.persistAndFlush(order);
  }
}
