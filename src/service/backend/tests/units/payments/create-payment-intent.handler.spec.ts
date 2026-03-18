import type { CommandBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IOrderReader } from '@/modules/ordering/domains/readers/i.order.reader';
import type { IOutboxProducer } from '@/shared/outbox/domain/producers/i.outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { CreatePaymentIntentCommand } from '@/modules/payments/application/commands/create-payment-intent.command';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { PaymentWebhookFailedEvent } from '@/contracts/payments/events/payment-webhook-failed.event';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';

describe('CreatePaymentIntentHandler', () => {
	it('creates payment using payment snapshot reader and schedules succeeded webhook event', async () => {
		const persisted: Array<{ id: string; orderId: string }> = [];
		const paymentRepository: IPaymentRepository = {
			persist: (payment) => {
				persisted.push({ id: payment.id, orderId: payment.orderId });
				return Promise.resolve();
			},
			findById: () => Promise.resolve(null),
			getById: () => Promise.reject(new Error('not implemented')),
			findRecent: () => Promise.resolve([]),
		};

		const findOrderById = jest.fn(() =>
			Promise.resolve({
				orderId: 'order-1',
				amount: 1200,
				currency: 'KRW',
			}),
		);
		const orderReader = {
			findById: findOrderById,
		} as unknown as IOrderReader;

		const outboxPublishMock = jest.fn<
			Promise<string>,
			[
				object,
				(
					| { delaySeconds?: number; messageGroupId?: string }
					| undefined
				)?,
			]
		>(() => Promise.resolve('outbox-1'));
		const outboxProducer = {
			publish: outboxPublishMock,
		} as unknown as IOutboxProducer;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};
		const executeMock = jest.fn(() => Promise.resolve(undefined));
		const commandBus = {
			execute: executeMock,
		} as unknown as CommandBus;

		const handler = new CreatePaymentIntentHandler(
			paymentRepository,
			orderReader,
			outboxProducer,
			commandBus,
			uow as UnitOfWork,
		);

		const command = new CreatePaymentIntentCommand({
			orderId: 'order-1',
			simulateOutcome: 'SUCCEEDED',
			simulateDelaySeconds: 3,
		});
		const result = await handler.execute(command);

		expect(findOrderById).toHaveBeenCalledWith('order-1');
		expect(persisted).toHaveLength(1);

		expect(outboxPublishMock).toHaveBeenCalledTimes(2);
		const [firstEvent, firstOptions] = outboxPublishMock.mock.calls[0] as [
			PaymentIntentCreatedEvent,
			{ messageGroupId: string },
		];
		expect(firstEvent).toBeInstanceOf(PaymentIntentCreatedEvent);
		expect(firstOptions).toEqual({ messageGroupId: 'order-1' });

		const [event, options] = outboxPublishMock.mock.calls[1] as [
			PaymentWebhookSucceededEvent,
			{ delaySeconds: number; messageGroupId: string },
		];
		expect(event).toBeInstanceOf(PaymentWebhookSucceededEvent);
		expect(options).toEqual({ delaySeconds: 3, messageGroupId: 'order-1' });
		expect(result.scheduled.eventType).toBe(
			PaymentWebhookSucceededEvent.eventType,
		);
		expect(executeMock).toHaveBeenCalledTimes(1);
		expect(executeMock.mock.calls[0]?.[0]).toBeInstanceOf(
			DispatchOutboxEventCommand,
		);
	});

	it('schedules failed webhook event when simulateOutcome is FAILED', async () => {
		const paymentRepository = {
			persist: jest.fn(() => Promise.resolve(undefined)),
			findById: jest.fn(() => Promise.resolve(null)),
			getById: jest.fn(() =>
				Promise.reject(new Error('not implemented')),
			),
			findRecent: jest.fn(() => Promise.resolve([])),
		} as unknown as IPaymentRepository;

		const findOrderById = jest.fn(() =>
			Promise.resolve({
				orderId: 'order-2',
				amount: 500,
				currency: 'KRW',
			}),
		);
		const orderReader = {
			findById: findOrderById,
		} as unknown as IOrderReader;

		const outboxPublishMock = jest.fn<
			Promise<string>,
			[
				object,
				(
					| { delaySeconds?: number; messageGroupId?: string }
					| undefined
				)?,
			]
		>(() => Promise.resolve('outbox-2'));

		const outboxProducer = {
			publish: outboxPublishMock,
		} as unknown as IOutboxProducer;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};
		const executeMock = jest.fn(() => Promise.resolve(undefined));
		const commandBus = {
			execute: executeMock,
		} as unknown as CommandBus;

		const handler = new CreatePaymentIntentHandler(
			paymentRepository,
			orderReader,
			outboxProducer,
			commandBus,
			uow as UnitOfWork,
		);

		const command = new CreatePaymentIntentCommand({
			orderId: 'order-2',
			simulateOutcome: 'FAILED',
		});
		const result = await handler.execute(command);

		expect(result.scheduled.eventType).toBe(
			PaymentWebhookFailedEvent.eventType,
		);
		expect(outboxPublishMock).toHaveBeenCalledTimes(2);
		expect(outboxPublishMock.mock.calls[0]?.[0]).toBeInstanceOf(
			PaymentIntentCreatedEvent,
		);
		expect(outboxPublishMock.mock.calls[1]?.[0]).toBeInstanceOf(
			PaymentWebhookFailedEvent,
		);
		expect(executeMock).toHaveBeenCalledTimes(1);
		expect(executeMock.mock.calls[0]?.[0]).toBeInstanceOf(
			DispatchOutboxEventCommand,
		);
	});
});
