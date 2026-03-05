import { QueryBus } from '@nestjs/cqrs';
import { GetDashboardSummaryBffHandler } from '@/bff/dashboard/application/queries/handlers/get-dashboard-summary-bff.handler';
import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import type { PaymentIntentResult } from '@/shared/readers/payments/dto/payment-intent.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { PaymentStatus } from '@/shared/payments/enums/payment-status.enum';
import { ShipmentStatus } from '@/shared/shipping/enums/shipment-status.enum';

describe('GetDashboardSummaryBffHandler', () => {
	it('unwraps paginated query results and returns aggregated view', async () => {
		const orders: PaginatedResult<OrderResult> = {
			items: [
				{
					orderId: 'order-1',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 100,
					currency: 'USD',
					items: [{ sku: 'sku-1', quantity: 1 }],
					paymentId: 'payment-1',
				},
			],
			page: 1,
			limit: 10,
			total: 1,
			totalPages: 1,
			hasNext: false,
		};
		const payments: PaymentIntentResult[] = [
			{
				paymentId: 'payment-1',
				orderId: 'order-1',
				amount: 100,
				currency: 'USD',
				status: PaymentStatus.SUCCEEDED,
			},
		];
		const shipments: PaginatedResult<ShipmentResult> = {
			items: [
				{
					shipmentId: 'shipment-1',
					orderId: 'order-1',
					status: ShipmentStatus.SHIPPED,
				},
			],
			page: 1,
			limit: 10,
			total: 1,
			totalPages: 1,
			hasNext: false,
		};
		const inventoryItems: PaginatedResult<InventoryItemResult> = {
			items: [
				{
					itemId: 'item-1',
					sku: 'sku-1',
					price: { currency: 'USD', amountMinor: 10000 },
					availableQuantity: 9,
					reservedQuantity: 1,
				},
			],
			page: 1,
			limit: 10,
			total: 1,
			totalPages: 1,
			hasNext: false,
		};

		const executeMock = jest
			.fn()
			.mockResolvedValueOnce(orders)
			.mockResolvedValueOnce(payments)
			.mockResolvedValueOnce(shipments)
			.mockResolvedValueOnce(inventoryItems);
		const queryBus = { execute: executeMock } as unknown as QueryBus;
		const handler = new GetDashboardSummaryBffHandler(queryBus);

		const result = await handler.execute(
			new GetDashboardSummaryBffQuery({ limit: 10 }),
		);

		expect(result.orders).toEqual(orders.items);
		expect(result.paymentIntents).toEqual(payments);
		expect(result.shipments).toEqual(shipments.items);
		expect(result.inventoryItems).toEqual(inventoryItems.items);
		expect(result.partialErrors).toBeUndefined();
		expect(executeMock).toHaveBeenCalledTimes(4);
	});

	it('collects partialErrors and falls back to empty lists for failed branches', async () => {
		const executeMock = jest
			.fn()
			.mockRejectedValueOnce(new Error('orders failed'))
			.mockResolvedValueOnce([])
			.mockRejectedValueOnce(new Error('shipments failed'))
			.mockResolvedValueOnce({
				items: [],
				page: 1,
				limit: 10,
				total: 0,
				totalPages: 1,
				hasNext: false,
			} as PaginatedResult<InventoryItemResult>);
		const queryBus = { execute: executeMock } as unknown as QueryBus;
		const handler = new GetDashboardSummaryBffHandler(queryBus);

		const result = await handler.execute(
			new GetDashboardSummaryBffQuery({ limit: 10 }),
		);

		expect(result.orders).toEqual([]);
		expect(result.paymentIntents).toEqual([]);
		expect(result.shipments).toEqual([]);
		expect(result.inventoryItems).toEqual([]);
		expect(result.partialErrors).toEqual(['orders', 'shipments']);
	});
});
