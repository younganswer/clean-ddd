import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrdersQuery } from '@/modules/ordering/application/queries/get-orders.query';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { PaginatedResult } from '@/common/types/paginated.result';

@QueryHandler(GetOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<GetOrdersBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(
		query: GetOrdersBffQuery,
	): Promise<PaginatedResult<OrderResult>> {
		return await this.queryBus.execute(new GetOrdersQuery(query));
	}
}
