import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(query: GetOrderQuery): Promise<OrderResult | null> {
		return this.orderReader.findById(query.orderId);
	}
}
