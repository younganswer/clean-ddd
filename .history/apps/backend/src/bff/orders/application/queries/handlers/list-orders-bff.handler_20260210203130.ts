import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '../../../../../shared/ordering/queries/list-orders.query';
import { ListOrdersBffQuery } from '../list-orders-bff.query';

@QueryHandler(ListOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<ListOrdersBffQuery> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: ListOrdersBffQuery) {
    const domainQuery = new ListOrdersQuery(query.input.limit);
    return await this.queryBus.execute(domainQuery as unknown as never);
  }
}
