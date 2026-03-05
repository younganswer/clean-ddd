import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { GetOrdersQuery } from '@/shared/ordering/queries/get-orders.query';
import { GetOrdersByUserIdQuery } from '@/shared/ordering/queries/get-orders-by-user-subject-id.query';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/shared/ordering/readers/i.order.reader';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@Injectable()
export class QueryBusOrderReader implements IOrderReader {
	constructor(private readonly queryBus: QueryBus) {}

	async findById(id: string): Promise<OrderResult | null> {
		return await this.queryBus.execute(new GetOrderQuery({ orderId: id }));
	}

	async findRecent(limit: number, offset = 0): Promise<OrderResult[]> {
		const page = await this.queryBus.execute<
			GetOrdersQuery,
			PaginatedResult<OrderResult>
		>(new GetOrdersQuery({ limit, offset }));
		return page.items;
	}

	async findByUserId(
		userId: string,
		limit: number,
		offset = 0,
	): Promise<OrderResult[]> {
		return await this.queryBus.execute(
			new GetOrdersByUserIdQuery({ userId, limit, offset }),
		);
	}

	async countAll(): Promise<number> {
		const page = await this.queryBus.execute<
			GetOrdersQuery,
			PaginatedResult<OrderResult>
		>(new GetOrdersQuery({ limit: 1, offset: 0 }));
		return page.total;
	}
}

export const QueryBusOrderReaderProvider = {
	provide: IOrderReaderSymbol,
	useClass: QueryBusOrderReader,
};
