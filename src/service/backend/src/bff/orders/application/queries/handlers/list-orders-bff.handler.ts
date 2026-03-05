import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrdersQuery } from '@/shared/ordering/queries/get-orders.query';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@QueryHandler(GetOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<GetOrdersBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(
		query: GetOrdersBffQuery,
	): Promise<PaginatedResult<OrderResult>> {
		return await this.queryBus.execute(new GetOrdersQuery(query));
	}
}
