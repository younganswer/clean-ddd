import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from '../../../domains/repositories/i.order.repository';
import type { IOrderRepository } from '../../../domains/repositories/i.order.repository';
import { GetOrderQuery } from '../get-order.query';
import type { OrderView } from '../order.view';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
  ) {}

  async execute(query: GetOrderQuery): Promise<OrderView | null> {
    const order = await this.orders.findById(query.orderId);
    if (!order) return null;

    return {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      items: order.items,
      paymentId: order.paymentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
