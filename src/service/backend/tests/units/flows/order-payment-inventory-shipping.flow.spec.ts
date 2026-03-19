import { CommandBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import { PaymentWebhookSucceededHandler } from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { AttachPaymentOnPaymentIntentCreatedHandler } from '@/modules/ordering/application/events/handlers/attach-payment-on-payment-intent-created.handler';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { PaymentFulfillmentRequestedHandler } from '@/saga-orchestrator/fulfillment/payment-fulfillment-requested.event-handler';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IOrderReader } from '@/modules/ordering/domains/readers/i.order.reader';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import type { IOutboxProducer } from '@/shared/outbox/domain/producers/i.outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { CreatePaymentIntentCommand } from '@/modules/payments/application/commands/create-payment-intent.command';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';
import { MarkOrderPaidCommand } from '@/modules/ordering/application/commands/mark-order-paid.command';
import type { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import type { IOutboxDelayedDispatchTrigger } from '@/shared/outbox/domain/schedulers/i.outbox-delayed-dispatch-trigger';

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

		const orderReader = {
			findById: jest.fn((id: string) =>
				Promise.resolve(id === order.orderId ? order : null),
			),
		} as unknown as IOrderReader;

		const publishedEvents: object[] = [];
		const outboxProducer = {
			publish: jest.fn((event: object) => {
				publishedEvents.push(event);
				return Promise.resolve(`outbox-${publishedEvents.length}`);
			}),
		} as unknown as IOutboxProducer;

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
		const delayedDispatchTrigger = {
			scheduleOneShot: jest.fn(() => Promise.resolve(true)),
		} as unknown as IOutboxDelayedDispatchTrigger;

		const createPaymentIntentHandler = new CreatePaymentIntentHandler(
			paymentRepository,
			orderReader,
			outboxProducer,
			delayedDispatchTrigger,
			commandBus,
			uow as UnitOfWork,
		);

		const command = new CreatePaymentIntentCommand({
			orderId: order.orderId,
			simulateOutcome: 'SUCCEEDED',
			simulateDelaySeconds: 0,
		});
		const createResult = await createPaymentIntentHandler.execute(command);

		expect(createResult.scheduled.eventType).toBe(
			PaymentWebhookSucceededEvent.eventType,
		);

		const paymentIntentCreatedEvent = publishedEvents.find(
			(event) => event instanceof PaymentIntentCreatedEvent,
		);
		expect(paymentIntentCreatedEvent).toBeInstanceOf(
			PaymentIntentCreatedEvent,
		);

		const attachPaymentOnPaymentIntentCreatedHandler =
			new AttachPaymentOnPaymentIntentCreatedHandler(commandBus);
		await attachPaymentOnPaymentIntentCreatedHandler.handle(
			paymentIntentCreatedEvent as PaymentIntentCreatedEvent,
		);
		expect(
			executedCommands.some(
				(command) => command instanceof AttachPaymentToOrderCommand,
			),
		).toBe(true);

		const webhookEvent = publishedEvents.find(
			(event) => event instanceof PaymentWebhookSucceededEvent,
		);
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
			new PaymentFulfillmentRequestedHandler(orderReader, commandBus);
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
