import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '../../../../../shared/ordering/queries/get-order.query';
import { GetOrderBffQuery } from '../get-order-bff.query';

@QueryHandler(GetOrderBffQuery)
export class GetOrderBffHandler implements IQueryHandler<GetOrderBffQuery> {
  async execute(query: GetOrderBffQuery) {
    const domainQuery = new GetOrderQuery(query.input.orderId);
    return (await (query as any).queryBus?.execute(domainQuery)) as any;
  }
}
