import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import { PaymentWebhookSucceededHandler } from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { PaymentFulfillmentRequestedHandler } from '@/saga-orchestrator/fulfillment/payment-fulfillment-requested.event-handler';
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
import { HandlePaymentWebhookSucceededCommand } from '@/shared/payments/commands/handle-payment-webhook-succeeded.command';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import type { IOrderPaymentSnapshotReader } from '@/shared/ordering/readers/i.order-payment-snapshot.reader';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { ReserveInventoryForOrderCommand } from '@/shared/inventory';
import { CreateShipmentForOrderCommand } from '@/shared/shipping';

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

		const queryBus = {
			execute: jest.fn((query: object) => {
				if (query instanceof GetOrderQuery) {
					return Promise.resolve(
						query.orderId === order.orderId ? order : null,
					);
				}
				return Promise.resolve(null);
			}),
		} as unknown as QueryBus;

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
			execute: jest.fn(async (command: object) => {
				executedCommands.push(command);

				if (command instanceof HandlePaymentWebhookSucceededCommand) {
					const payment = await paymentRepository.getById(
						command.paymentId,
					);
					payment.markSucceeded();
					await paymentRepository.persist(payment);
					await outboxProducer.publish(
						new PaymentFulfillmentRequestedEvent({
							orderId: command.orderId,
						}),
					);
				}

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
			new PaymentWebhookSucceededHandler(commandBus);
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
			new PaymentFulfillmentRequestedHandler(queryBus, commandBus);
		await paymentFulfillmentRequestedHandler.handle(
			fulfillmentRequestedEvent as PaymentFulfillmentRequestedEvent,
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
