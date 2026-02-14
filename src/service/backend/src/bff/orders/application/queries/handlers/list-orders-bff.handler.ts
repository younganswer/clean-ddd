import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import { ListOrdersBffQuery } from '@/bff/orders/application/queries/list-orders-bff.query';
import type { OrderView } from '@/shared/ordering/readers/order.view';

@QueryHandler(ListOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<ListOrdersBffQuery> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: ListOrdersBffQuery) {
    const domainQuery = new ListOrdersQuery(query.input.limit);
    return await this.queryBus.execute<ListOrdersQuery, OrderView[]>(
      domainQuery,
    );
  }
}
