import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersQuery } from '@/shared/ordering/queries/get-orders.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

@QueryHandler(GetOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<GetOrdersQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(
		query: GetOrdersQuery,
	): Promise<PaginatedResult<OrderResult>> {
		const { limit, offset } = query;

		const [items, total] = await Promise.all([
			this.orderReader.findRecent(limit, offset),
			this.orderReader.countAll(),
		]);

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			offset,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
