import { QueryBus } from '@nestjs/cqrs';
import { ListOrdersBffHandler } from '@/bff/orders/application/queries/handlers/list-orders-bff.handler';
import { ListOrdersBffQuery } from '@/bff/orders/application/queries/list-orders-bff.query';
import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

describe('ListOrdersBffHandler', () => {
	it('forwards limit/page to ListOrdersQuery and returns paginated result', async () => {
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
			page: 3,
			limit: 7,
			total: 21,
			totalPages: 3,
			hasNext: false,
		};

		const executeMock = jest
			.fn<Promise<PaginatedResult<OrderResult>>, [ListOrdersQuery]>()
			.mockResolvedValue(paginated);
		const queryBus = {
			execute: executeMock,
		} as unknown as QueryBus;

		const handler = new ListOrdersBffHandler(queryBus);
		const result = await handler.execute(
			new ListOrdersBffQuery({ limit: 7, page: 3 }),
		);

		expect(executeMock).toHaveBeenCalledTimes(1);
		const domainQuery = executeMock.mock.calls[0][0];
		expect(domainQuery).toBeInstanceOf(ListOrdersQuery);
		expect(domainQuery.limit).toBe(7);
		expect(domainQuery.page).toBe(3);
		expect(result).toEqual(paginated);
	});
});
