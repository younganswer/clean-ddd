import { IQueryHandler, QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';

@QueryHandler(GetOrderBffQuery)
export class GetOrderBffHandler implements IQueryHandler<GetOrderBffQuery> {
	constructor(private readonly queryBus: QueryBus) {}

	async execute(query: GetOrderBffQuery) {
		return await this.queryBus.execute(
			new GetOrderQuery({ orderId: query.orderId }),
		);
	}
}
