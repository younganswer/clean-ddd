import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domains/readers/i.order.reader';

@QueryHandler(GetOrdersBffQuery)
export class ListOrdersBffHandler implements IQueryHandler<GetOrdersBffQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(
		query: GetOrdersBffQuery,
	): Promise<PaginatedResult<OrderResult>> {
		const [items, total] = await Promise.all([
			this.orderReader.findRecent({
				limit: query.limit,
				offset: query.offset,
			}),
			this.orderReader.countAll(),
		]);

		const totalPages = Math.max(1, Math.ceil(total / query.limit));

		return {
			items,
			offset: query.offset,
			limit: query.limit,
			total,
			totalPages,
			hasNext: query.offset + items.length < total,
		};
	}
}
