import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrdersByUserIdQuery } from '@/modules/ordering/application/queries/get-orders-by-user-subject-id.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domains/readers/i.order.reader';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';

@QueryHandler(GetOrdersByUserIdQuery)
export class ListOrdersByUserSubjectIdHandler implements IQueryHandler<GetOrdersByUserIdQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(query: GetOrdersByUserIdQuery): Promise<OrderResult[]> {
		return await this.orderReader.findByUserId(
			query.userId,
			query.limit,
			query.offset,
		);
	}
}
