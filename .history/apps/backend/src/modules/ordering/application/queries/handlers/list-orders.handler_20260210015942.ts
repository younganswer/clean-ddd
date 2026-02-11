import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from '../../../domains/repositories/i.order.repository';
import type { IOrderRepository } from '../../../domains/repositories/i.order.repository';
import { ListOrdersQuery } from '../list-orders.query';

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
  constructor(
    @Inject(IOrderRepositorySymbol)
    private readonly orders: IOrderRepository,
  ) {}

  async execute(query: ListOrdersQuery) {
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
    const orders = await this.orders.findRecent(limit);

    return orders.map((o) => ({
      orderId: o.id,
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      items: o.items,
      paymentId: o.paymentId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }
}
