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
		private readonly orders: IOrderReader,
	) {}

	async execute(query: ListOrdersQuery): Promise<PaginatedView<OrderView>> {
		const limit = Math.min(
			50,
			Math.max(1, Number(query.limit ?? 20) || 20),
		);
		const page = Math.max(1, Number(query.page ?? 1) || 1);
		const offset = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.orders.findRecent(limit, offset),
			this.orders.countAll(),
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
