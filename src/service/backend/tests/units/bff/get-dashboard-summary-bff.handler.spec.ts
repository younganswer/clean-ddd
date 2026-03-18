import { GetDashboardSummaryBffHandler } from '@/bff/dashboard/application/queries/handlers/get-dashboard-summary-bff.handler';
import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';
import type { IInventoryReader } from '@/modules/inventory/domains/readers/i.inventory.reader';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import type { IOrderReader } from '@/modules/ordering/domains/readers/i.order.reader';
import type { IPaymentIntentReader } from '@/modules/payments/domains/readers/i.payment-intent.reader';
import type { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import type { IShipmentReader } from '@/modules/shipping/domains/readers/i.shipment.reader';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import type { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import { ShipmentStatus } from '@/modules/shipping/domains/enums/shipment-status.enum';

describe('GetDashboardSummaryBffHandler', () => {
	it('unwraps paginated query results and returns aggregated view', async () => {
		const orders: OrderResult[] = [
			{
				orderId: 'order-1',
				userId: 'user-1',
				status: OrderStatus.PAID,
				amount: 100,
				currency: 'USD',
				items: [{ sku: 'sku-1', quantity: 1 }],
				paymentId: 'payment-1',
			},
		];
		const payments: PaymentIntentResult[] = [
			{
				paymentId: 'payment-1',
				orderId: 'order-1',
				amount: 100,
				currency: 'USD',
				status: PaymentStatus.SUCCEEDED,
			},
		];
		const shipments: ShipmentResult[] = [
			{
				shipmentId: 'shipment-1',
				orderId: 'order-1',
				status: ShipmentStatus.SHIPPED,
			},
		];
		const inventoryItems: InventoryItemResult[] = [
			{
				itemId: 'item-1',
				sku: 'sku-1',
				price: { currency: 'USD', amountMinor: 10000 },
				availableQuantity: 9,
				reservedQuantity: 1,
			},
		];

		const findRecentOrders = jest.fn(() => Promise.resolve(orders));
		const orderReader = {
			findRecent: findRecentOrders,
		} as unknown as IOrderReader;
		const findRecentPaymentIntents = jest.fn(() =>
			Promise.resolve(payments),
		);
		const paymentIntentReader = {
			findRecent: findRecentPaymentIntents,
		} as unknown as IPaymentIntentReader;
		const findRecentShipments = jest.fn(() => Promise.resolve(shipments));
		const shipmentReader = {
			findRecent: findRecentShipments,
		} as unknown as IShipmentReader;
		const findRecentInventoryItems = jest.fn(() =>
			Promise.resolve(inventoryItems),
		);
		const inventoryReader = {
			findRecentItems: findRecentInventoryItems,
		} as unknown as IInventoryReader;
		const handler = new GetDashboardSummaryBffHandler(
			orderReader,
			paymentIntentReader,
			shipmentReader,
			inventoryReader,
		);

		const query = new GetDashboardSummaryBffQuery({ limit: 10 });
		const result = await handler.execute(query);

		expect(result.orders).toEqual(orders);
		expect(result.paymentIntents).toEqual(payments);
		expect(result.shipments).toEqual(shipments);
		expect(result.inventoryItems).toEqual(inventoryItems);
		expect(result.partialErrors).toBeUndefined();
		expect(findRecentOrders).toHaveBeenCalledWith({ limit: 10 });
		expect(findRecentPaymentIntents).toHaveBeenCalledWith({
			limit: 10,
		});
		expect(findRecentShipments).toHaveBeenCalledWith({ limit: 10 });
		expect(findRecentInventoryItems).toHaveBeenCalledWith({
			limit: 10,
		});
	});

	it('collects partialErrors and falls back to empty lists for failed branches', async () => {
		const orderReader = {
			findRecent: jest.fn(() =>
				Promise.reject(new Error('orders failed')),
			),
		} as unknown as IOrderReader;
		const paymentIntentReader = {
			findRecent: jest.fn(() => Promise.resolve([])),
		} as unknown as IPaymentIntentReader;
		const shipmentReader = {
			findRecent: jest.fn(() =>
				Promise.reject(new Error('shipments failed')),
			),
		} as unknown as IShipmentReader;
		const inventoryReader = {
			findRecentItems: jest.fn(() => Promise.resolve([])),
		} as unknown as IInventoryReader;
		const handler = new GetDashboardSummaryBffHandler(
			orderReader,
			paymentIntentReader,
			shipmentReader,
			inventoryReader,
		);

		const query = new GetDashboardSummaryBffQuery({ limit: 10 });
		const result = await handler.execute(query);

		expect(result.orders).toEqual([]);
		expect(result.paymentIntents).toEqual([]);
		expect(result.shipments).toEqual([]);
		expect(result.inventoryItems).toEqual([]);
		expect(result.partialErrors).toEqual([
			{ domain: 'orders', message: 'orders failed' },
			{ domain: 'shipments', message: 'shipments failed' },
		]);
	});
});
