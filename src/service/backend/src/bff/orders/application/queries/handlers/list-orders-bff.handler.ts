import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import { ListOrdersBffQuery } from '@/bff/orders/application/queries/list-orders-bff.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

@QueryHandler(ListOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<ListOrdersBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(query: ListOrdersBffQuery) {
		const domainQuery = new ListOrdersQuery(query.input.limit);
		return await this.queryBus.execute<ListOrdersQuery, OrderResult[]>(
			domainQuery,
		);
	}
}
