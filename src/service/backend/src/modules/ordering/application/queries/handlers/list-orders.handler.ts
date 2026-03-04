import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import type { OrderView } from '@/shared/ordering/readers/order.view';

@QueryHandler(ListOrdersQuery)
export class ListOrdersHandler implements IQueryHandler<ListOrdersQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(query: ListOrdersQuery): Promise<PaginatedView<OrderView>> {
		const { limit, page } = query;
		const offset = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.orderReader.findRecent(limit, offset),
			this.orderReader.countAll(),
		]);

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			page,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
