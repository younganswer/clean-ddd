import { CommandBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import { PaymentWebhookSucceededHandler } from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { PaymentFulfillmentRequestedHandler } from '@/saga-orchestrator/fulfillment/payment-fulfillment-requested.event-handler';
import { ReserveInventoryForOrderRequestedHandler } from '@/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler';
import { CreateShipmentForOrderRequestedHandler } from '@/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	CreatePaymentIntentCommand,
	PaymentFulfillmentRequestedEvent,
	PaymentStatus,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import type { IOrderReader } from '@/shared/ordering/readers/i.order.reader';
import type { IOrderPaymentSnapshotReader } from '@/shared/ordering/readers/i.order-payment-snapshot.reader';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import {
	ReserveInventoryForOrderCommand,
	ReserveInventoryForOrderRequestedEvent,
} from '@/shared/inventory';
import {
	CreateShipmentForOrderCommand,
	CreateShipmentForOrderRequestedEvent,
} from '@/shared/shipping';

describe('Cross module flow (order -> payment -> inventory/shipping)', () => {
	it('keeps command/event chain stable on payment succeeded flow', async () => {
		const order: OrderResult = {
			orderId: 'order-101',
			userId: 'user-101',
			status: OrderStatus.PENDING_PAYMENT,
			amount: 1500,
			currency: 'KRW',
			items: [
				{ sku: 'sku-apple', quantity: 1 },
				{ sku: 'sku-banana', quantity: 2 },
			],
			paymentId: null,
		};

		const paymentById = new Map<string, PaymentIntent>();
		const paymentRepository: IPaymentRepository = {
			persist: (payment) => {
				paymentById.set(payment.id, payment);
				return Promise.resolve();
			},
			findById: (id) => Promise.resolve(paymentById.get(id) ?? null),
			getById: (id) => {
				const payment = paymentById.get(id);
				if (!payment) {
					return Promise.reject(
						new Error(`payment not found: ${id}`),
					);
				}
				return Promise.resolve(payment);
			},
			findRecent: () => Promise.resolve([]),
		};

		const findOrderByIdMock = jest.fn((id: string) =>
			Promise.resolve(id === order.orderId ? order : null),
		);
		const orderReader: IOrderReader = {
			findById: findOrderByIdMock,
			getById: jest.fn((id: string) => {
				if (id !== order.orderId) {
					return Promise.reject(new Error(`order not found: ${id}`));
				}
				return Promise.resolve(order);
			}),
			findRecent: () => Promise.resolve([order]),
			findByUserId: () => Promise.resolve([order]),
			countAll: () => Promise.resolve(1),
		};
		const orderPaymentSnapshotReader: IOrderPaymentSnapshotReader = {
			getByOrderId: (id: string) =>
				id === order.orderId
					? Promise.resolve({
							orderId: order.orderId,
							amount: order.amount,
							currency: order.currency,
						})
					: Promise.reject(
							new Error(`order snapshot not found: ${id}`),
						),
		};

		const publishedEvents: object[] = [];
		const outboxProducer = {
			publish: jest.fn((event: object) => {
				publishedEvents.push(event);
				return Promise.resolve(`outbox-${publishedEvents.length}`);
			}),
		} as unknown as OutboxProducer;

		const executedCommands: object[] = [];
		const commandBus = {
			execute: jest.fn((command: object) => {
				executedCommands.push(command);
				return Promise.resolve(undefined);
			}),
		} as unknown as CommandBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const createPaymentIntentHandler = new CreatePaymentIntentHandler(
			paymentRepository,
			orderPaymentSnapshotReader,
			uow as UnitOfWork,
			outboxProducer,
			commandBus,
		);

		const createResult = await createPaymentIntentHandler.execute(
			new CreatePaymentIntentCommand({
				orderId: order.orderId,
				simulateOutcome: 'SUCCEEDED',
				simulateDelaySeconds: 0,
			}),
		);

		expect(createResult.scheduled.eventType).toBe(
			PaymentWebhookSucceededEvent.eventType,
		);
		expect(executedCommands[0]).toBeInstanceOf(AttachPaymentToOrderCommand);

		const webhookEvent = publishedEvents[0];
		expect(webhookEvent).toBeInstanceOf(PaymentWebhookSucceededEvent);
		const paymentWebhookSucceededHandler =
			new PaymentWebhookSucceededHandler(
				paymentRepository,
				uow as UnitOfWork,
				outboxProducer,
			);
		await paymentWebhookSucceededHandler.handle(
			webhookEvent as PaymentWebhookSucceededEvent,
		);

		const markOrderPaidOnPaymentWebhookSucceededHandler =
			new MarkOrderPaidOnPaymentWebhookSucceededHandler(commandBus);
		await markOrderPaidOnPaymentWebhookSucceededHandler.handle(
			webhookEvent as PaymentWebhookSucceededEvent,
		);

		const payment = await paymentRepository.findById(
			createResult.paymentId,
		);
		expect(payment?.status).toBe(PaymentStatus.SUCCEEDED);
		expect(
			executedCommands.some((c) => c instanceof MarkOrderPaidCommand),
		).toBe(true);

		const fulfillmentRequestedEvent = publishedEvents.find(
			(event) => event instanceof PaymentFulfillmentRequestedEvent,
		);
		expect(fulfillmentRequestedEvent).toBeInstanceOf(
			PaymentFulfillmentRequestedEvent,
		);

		const paymentFulfillmentRequestedHandler =
			new PaymentFulfillmentRequestedHandler(orderReader, outboxProducer);
		await paymentFulfillmentRequestedHandler.handle(
			fulfillmentRequestedEvent as PaymentFulfillmentRequestedEvent,
		);

		const inventoryEvent = publishedEvents.find(
			(event) => event instanceof ReserveInventoryForOrderRequestedEvent,
		);
		const shippingEvent = publishedEvents.find(
			(event) => event instanceof CreateShipmentForOrderRequestedEvent,
		);
		expect(inventoryEvent).toBeInstanceOf(
			ReserveInventoryForOrderRequestedEvent,
		);
		expect(shippingEvent).toBeInstanceOf(
			CreateShipmentForOrderRequestedEvent,
		);

		const reserveInventoryForOrderRequestedHandler =
			new ReserveInventoryForOrderRequestedHandler(commandBus);
		const createShipmentForOrderRequestedHandler =
			new CreateShipmentForOrderRequestedHandler(commandBus);

		await reserveInventoryForOrderRequestedHandler.handle(
			inventoryEvent as ReserveInventoryForOrderRequestedEvent,
		);
		await createShipmentForOrderRequestedHandler.handle(
			shippingEvent as CreateShipmentForOrderRequestedEvent,
		);

		expect(
			executedCommands.some(
				(command) => command instanceof ReserveInventoryForOrderCommand,
			),
		).toBe(true);
		expect(
			executedCommands.some(
				(command) => command instanceof CreateShipmentForOrderCommand,
			),
		).toBe(true);
	});
});
