import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ListOrdersByUserIdQuery } from '@/shared/ordering/queries/list-orders-by-user-subject-id.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { OrderView } from '@/shared/ordering/readers/order.view';

@QueryHandler(ListOrdersByUserIdQuery)
export class ListOrdersByUserSubjectIdHandler implements IQueryHandler<ListOrdersByUserIdQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(query: ListOrdersByUserIdQuery): Promise<OrderView[]> {
		return await this.orderReader.findByUserId(
			query.userId,
			query.limit,
			query.offset,
		);
	}
}
