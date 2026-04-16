import { CommandBus } from '@nestjs/cqrs';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { ReleaseInventoryForOrderCommand } from '@/modules/inventory/application/commands/release-inventory-for-order.command';
import type { IOrderReader } from '@/modules/ordering/domain/readers/i.order.reader';
import { OrderStatus } from '@/modules/ordering/domain/enums/order-status.enum';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { PaymentFulfillmentRequestedHandler } from '@/saga-orchestrator/fulfillment/payment-fulfillment-requested.event-handler';

describe('PaymentFulfillmentRequestedHandler', () => {
	it('dispatches reserve inventory and create shipment commands in sequence', async () => {
		const commandExecute = jest.fn(() => Promise.resolve(undefined));
		const commandBus = {
			execute: commandExecute,
		} as unknown as CommandBus;

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-1',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 1000,
					currency: 'KRW',
					items: [
						{ sku: 'sku-a', quantity: 1 },
						{ sku: 'sku-b', quantity: 2 },
					],
					paymentId: 'payment-1',
				}),
			),
		} as unknown as IOrderReader;

		const handler = new PaymentFulfillmentRequestedHandler(
			orderReader,
			commandBus,
		);

		await handler.handle(
			new PaymentFulfillmentRequestedEvent({ orderId: 'order-1' }),
		);

		expect(commandExecute).toHaveBeenCalledTimes(2);
		const calls = commandExecute.mock.calls as unknown[][];
		expect(calls[0]?.[0]).toBeInstanceOf(ReserveInventoryForOrderCommand);
		expect(calls[1]?.[0]).toBeInstanceOf(CreateShipmentForOrderCommand);
	});

	it('throws when order has no items and does not dispatch commands', async () => {
		const commandExecute = jest.fn(() => Promise.resolve(undefined));
		const commandBus = {
			execute: commandExecute,
		} as unknown as CommandBus;

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-empty',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 0,
					currency: 'KRW',
					items: [],
					paymentId: 'payment-1',
				}),
			),
		} as unknown as IOrderReader;

		const handler = new PaymentFulfillmentRequestedHandler(
			orderReader,
			commandBus,
		);

		await expect(
			handler.handle(
				new PaymentFulfillmentRequestedEvent({
					orderId: 'order-empty',
				}),
			),
		).rejects.toThrow();
		expect(commandExecute).not.toHaveBeenCalled();
	});

	it('releases inventory when shipment creation fails', async () => {
		const shipmentError = new Error('shipment failed');
		const commandExecute = jest.fn((command: unknown) => {
			if (command instanceof CreateShipmentForOrderCommand) {
				return Promise.reject(shipmentError);
			}

			return Promise.resolve(undefined);
		});
		const commandBus = {
			execute: commandExecute,
		} as unknown as CommandBus;

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-rollback',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 1000,
					currency: 'KRW',
					items: [{ sku: 'sku-a', quantity: 1 }],
					paymentId: 'payment-1',
				}),
			),
		} as unknown as IOrderReader;

		const handler = new PaymentFulfillmentRequestedHandler(
			orderReader,
			commandBus,
		);

		await expect(
			handler.handle(
				new PaymentFulfillmentRequestedEvent({
					orderId: 'order-rollback',
				}),
			),
		).rejects.toThrow('shipment failed');

		expect(commandExecute).toHaveBeenCalledTimes(3);
		const calls = commandExecute.mock.calls as unknown[][];
		expect(calls[0]?.[0]).toBeInstanceOf(ReserveInventoryForOrderCommand);
		expect(calls[1]?.[0]).toBeInstanceOf(CreateShipmentForOrderCommand);
		expect(calls[2]?.[0]).toBeInstanceOf(ReleaseInventoryForOrderCommand);
	});

	it('throws combined error when shipment and compensation both fail', async () => {
		const commandExecute = jest.fn((command: unknown) => {
			if (command instanceof CreateShipmentForOrderCommand) {
				return Promise.reject(new Error('shipment failed'));
			}
			if (command instanceof ReleaseInventoryForOrderCommand) {
				return Promise.reject(new Error('release failed'));
			}

			return Promise.resolve(undefined);
		});
		const commandBus = {
			execute: commandExecute,
		} as unknown as CommandBus;

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-compensation-failed',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 1000,
					currency: 'KRW',
					items: [{ sku: 'sku-a', quantity: 1 }],
					paymentId: 'payment-1',
				}),
			),
		} as unknown as IOrderReader;

		const handler = new PaymentFulfillmentRequestedHandler(
			orderReader,
			commandBus,
		);

		await expect(
			handler.handle(
				new PaymentFulfillmentRequestedEvent({
					orderId: 'order-compensation-failed',
				}),
			),
		).rejects.toThrow(
			'shipment creation failed and compensation failed: original=shipment failed compensation=release failed',
		);
	});
});
