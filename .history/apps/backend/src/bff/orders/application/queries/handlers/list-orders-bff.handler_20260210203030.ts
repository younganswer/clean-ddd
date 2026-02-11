import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '../../../../../shared/ordering/queries/list-orders.query';
import { ListOrdersBffQuery } from '../list-orders-bff.query';

@QueryHandler(ListOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<ListOrdersBffQuery> {
  async execute(query: ListOrdersBffQuery) {
    const domainQuery = new ListOrdersQuery(query.input.limit);
    return (await (query as any).queryBus?.execute(domainQuery)) as any;
  }
}
