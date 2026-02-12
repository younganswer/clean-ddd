import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersByUserSubjectIdQuery } from '../../../../../shared/ordering/queries/list-orders-by-user-subject-id.query';
import {
  IOrderReaderSymbol,
  type IOrderReader,
} from '../../../../../shared/ordering/readers/i.order.reader';
import type { OrderView } from '../../../../../shared/ordering/readers/order.view';

@QueryHandler(ListOrdersByUserSubjectIdQuery)
export class ListOrdersByUserSubjectIdHandler implements IQueryHandler<ListOrdersByUserSubjectIdQuery> {
  constructor(
    @Inject(IOrderReaderSymbol)
    private readonly orders: IOrderReader,
  ) {}

  async execute(query: ListOrdersByUserSubjectIdQuery): Promise<OrderView[]> {
    const userSubjectId = String(query.userSubjectId ?? '').trim();
    if (!userSubjectId) return [];

    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 200) || 200));
    const offset = Math.max(0, Number(query.offset ?? 0) || 0);

    return await this.orders.findByUserSubjectId(userSubjectId, limit, offset);
  }
}
