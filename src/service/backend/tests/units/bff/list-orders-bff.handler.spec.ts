import { QueryBus } from '@nestjs/cqrs';
import { ListOrdersBffHandler } from '@/bff/orders/application/queries/handlers/list-orders-bff.handler';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import { GetOrdersQuery } from '@/modules/ordering/application/queries/get-orders.query';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';

describe('ListOrdersBffHandler', () => {
	it('forwards limit/page to GetOrdersQuery and returns paginated result', async () => {
		const paginated: PaginatedResult<OrderResult> = {
			items: [
				{
					orderId: 'order-1',
					userId: 'user-1',
					status: OrderStatus.PENDING_PAYMENT,
					amount: 100,
					currency: 'USD',
					items: [{ sku: 'sku-1', quantity: 1 }],
					paymentId: null,
				},
			],
			limit: 7,
			offset: 3,
			total: 21,
			totalPages: 3,
			hasNext: false,
		};

		const executeMock = jest
			.fn<Promise<PaginatedResult<OrderResult>>, [GetOrdersQuery]>()
			.mockResolvedValue(paginated);
		const queryBus = {
			execute: executeMock,
		} as unknown as QueryBus;

		const handler = new ListOrdersBffHandler(queryBus);
		const result = await handler.execute(
			new GetOrdersBffQuery({ limit: 7, offset: 3 }),
		);

		expect(executeMock).toHaveBeenCalledTimes(1);
		const domainQuery = executeMock.mock.calls[0][0];
		expect(domainQuery).toBeInstanceOf(GetOrdersQuery);
		expect(domainQuery.limit).toBe(7);
		expect(domainQuery.offset).toBe(3);
		expect(result).toEqual(paginated);
	});
});
