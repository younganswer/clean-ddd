import { GetOrderDetailBffHandler } from '@/bff/order-detail/application/queries/handlers/get-order-detail-bff.handler';
import { GetOrderDetailBffQuery } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import type { IInventoryReader } from '@/modules/inventory/domains/readers/i.inventory.reader';
import { InventoryReservationResult } from '@/modules/inventory/domains/readers/inventory-reservation.result';
import type { IOrderReader } from '@/modules/ordering/domains/readers/i.order.reader';
import { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';
import type { IPaymentIntentReader } from '@/modules/payments/domains/readers/i.payment-intent.reader';
import { PaymentIntentResult } from '@/modules/payments/domains/readers/payment-intent.result';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import type { IShipmentReader } from '@/modules/shipping/domains/readers/i.shipment.reader';
import { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import { ShipmentStatus } from '@/modules/shipping/domains/enums/shipment-status.enum';

describe('GetOrderDetailBffHandler', () => {
	const order = new OrderResult(
		'order-1',
		'user-1',
		OrderStatus.PAID,
		1200,
		'KRW',
		[],
		'payment-1',
	);
	const payment = new PaymentIntentResult(
		'payment-1',
		'order-1',
		1200,
		'KRW',
		PaymentStatus.SUCCEEDED,
	);
	const shipment = new ShipmentResult(
		'shipment-1',
		'order-1',
		ShipmentStatus.SHIPPED,
	);
	const reservations = [
		new InventoryReservationResult(
			'reservation-1',
			'order-1',
			'SKU-001',
			2,
		),
	];

	it('returns null when order does not exist', async () => {
		const orderReader = {
			findById: jest.fn(() => Promise.resolve(null)),
		} as unknown as IOrderReader;
		const paymentFindById = jest.fn(() => Promise.resolve(payment));
		const paymentIntentReader = {
			findById: paymentFindById,
		} as unknown as IPaymentIntentReader;
		const shipmentFindByOrderId = jest.fn(() => Promise.resolve(shipment));
		const shipmentReader = {
			findByOrderId: shipmentFindByOrderId,
		} as unknown as IShipmentReader;
		const findReservationsByOrderId = jest.fn(() =>
			Promise.resolve(reservations),
		);
		const inventoryReader = {
			findReservationsByOrderId,
		} as unknown as IInventoryReader;

		const handler = new GetOrderDetailBffHandler(
			orderReader,
			paymentIntentReader,
			shipmentReader,
			inventoryReader,
		);

		const result = await handler.execute(
			new GetOrderDetailBffQuery({ orderId: 'order-1' }),
		);

		expect(result).toBeNull();
		expect(paymentFindById).not.toHaveBeenCalled();
		expect(shipmentFindByOrderId).not.toHaveBeenCalled();
		expect(findReservationsByOrderId).not.toHaveBeenCalled();
	});

	it('collects partialErrors and applies fallbacks for rejected branches', async () => {
		const orderReader = {
			findById: jest.fn(() => Promise.resolve(order)),
		} as unknown as IOrderReader;
		const paymentIntentReader = {
			findById: jest.fn(() =>
				Promise.reject(new Error('payment failed')),
			),
		} as unknown as IPaymentIntentReader;
		const shipmentReader = {
			findByOrderId: jest.fn(() => Promise.resolve(shipment)),
		} as unknown as IShipmentReader;
		const inventoryReader = {
			findReservationsByOrderId: jest.fn(() =>
				Promise.reject(new Error('reservations failed')),
			),
		} as unknown as IInventoryReader;

		const handler = new GetOrderDetailBffHandler(
			orderReader,
			paymentIntentReader,
			shipmentReader,
			inventoryReader,
		);

		const result = await handler.execute(
			new GetOrderDetailBffQuery({ orderId: 'order-1' }),
		);

		expect(result).toEqual({
			order,
			paymentIntent: null,
			shipment,
			reservations: [],
			partialErrors: [
				{ domain: 'paymentIntent', message: 'payment failed' },
				{ domain: 'reservations', message: 'reservations failed' },
			],
		});
	});

	it('skips optional branches when include flags are false', async () => {
		const orderReader = {
			findById: jest.fn(() => Promise.resolve(order)),
		} as unknown as IOrderReader;
		const paymentFindById = jest.fn(() => Promise.resolve(payment));
		const paymentIntentReader = {
			findById: paymentFindById,
		} as unknown as IPaymentIntentReader;
		const shipmentFindByOrderId = jest.fn(() => Promise.resolve(shipment));
		const shipmentReader = {
			findByOrderId: shipmentFindByOrderId,
		} as unknown as IShipmentReader;
		const findReservationsByOrderId = jest.fn(() =>
			Promise.resolve(reservations),
		);
		const inventoryReader = {
			findReservationsByOrderId,
		} as unknown as IInventoryReader;

		const handler = new GetOrderDetailBffHandler(
			orderReader,
			paymentIntentReader,
			shipmentReader,
			inventoryReader,
		);

		const result = await handler.execute(
			new GetOrderDetailBffQuery({
				orderId: 'order-1',
				includePayment: false,
				includeShipment: false,
				includeReservations: false,
			}),
		);

		expect(result).toEqual({
			order,
			paymentIntent: null,
			shipment: null,
			reservations: [],
			partialErrors: undefined,
		});
		expect(paymentFindById).not.toHaveBeenCalled();
		expect(shipmentFindByOrderId).not.toHaveBeenCalled();
		expect(findReservationsByOrderId).not.toHaveBeenCalled();
	});
});
