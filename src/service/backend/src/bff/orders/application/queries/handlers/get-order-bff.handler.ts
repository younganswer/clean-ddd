import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domain/readers/i.order.reader';

@QueryHandler(GetOrderBffQuery)
export class GetOrderBffHandler implements IQueryHandler<GetOrderBffQuery> {
	constructor(
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
	) {}

	async execute(query: GetOrderBffQuery) {
		return await this.orderReader.findById(query.orderId);
	}
}
