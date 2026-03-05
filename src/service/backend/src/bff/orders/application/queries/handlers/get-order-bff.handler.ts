import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

@QueryHandler(GetOrderBffQuery)
export class GetOrderBffHandler implements IQueryHandler<GetOrderBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(query: GetOrderBffQuery) {
		const domainQuery = new GetOrderQuery(query.input.orderId);
		return await this.queryBus.execute<GetOrderQuery, OrderResult | null>(
			domainQuery,
		);
	}
}
