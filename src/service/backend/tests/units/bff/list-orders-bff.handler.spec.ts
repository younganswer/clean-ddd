import { ListOrdersBffHandler } from '@/bff/orders/application/queries/handlers/list-orders-bff.handler';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { IOrderReader } from '@/modules/ordering/domains/readers/i.order.reader';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';

describe('ListOrdersBffHandler', () => {
	it('uses order reader and returns paginated result', async () => {
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
			hasNext: true,
		};

		const findRecentOrders = jest.fn(() =>
			Promise.resolve(paginated.items),
		);
		const countAllOrders = jest.fn(() => Promise.resolve(paginated.total));
		const orderReader = {
			findRecent: findRecentOrders,
			countAll: countAllOrders,
		} as unknown as IOrderReader;

		const handler = new ListOrdersBffHandler(orderReader);
		const result = await handler.execute(
			new GetOrdersBffQuery({ limit: 7, offset: 3 }),
		);

		expect(findRecentOrders).toHaveBeenCalledWith(7, 3);
		expect(countAllOrders).toHaveBeenCalledTimes(1);
		expect(result).toEqual(paginated);
	});
});
