import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '../../../../../shared/ordering/queries/get-order.query';
import { GetOrderBffQuery } from '../get-order-bff.query';
import type { OrderView } from '../../../../../shared/ordering/readers/order.view';

@QueryHandler(GetOrderBffQuery)
export class GetOrderBffHandler implements IQueryHandler<GetOrderBffQuery> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: GetOrderBffQuery) {
    const domainQuery = new GetOrderQuery(query.input.orderId);
    return await this.queryBus.execute<GetOrderQuery, OrderView | null>(domainQuery);
  }
}
