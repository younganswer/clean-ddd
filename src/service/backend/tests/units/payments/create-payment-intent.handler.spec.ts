import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IOutboxProducer } from '@/shared/outbox/domain/producers/i.outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { CreatePaymentIntentCommand } from '@/modules/payments/application/commands/create-payment-intent.command';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/contracts/payments';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';
import { GetOrderQuery } from '@/modules/ordering/application/queries/get-order.query';

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

		const queryExecuteMock = jest.fn(() =>
			Promise.resolve({
				orderId: 'order-1',
				amount: 1200,
				currency: 'KRW',
			}),
		);
		const queryBus = {
			execute: queryExecuteMock,
		} as unknown as QueryBus;

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

		const commandExecuteMock = jest.fn<
			Promise<void>,
			[AttachPaymentToOrderCommand]
		>(() => Promise.resolve(undefined));
		const commandBus = {
			execute: commandExecuteMock,
		} as unknown as CommandBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new CreatePaymentIntentHandler(
			paymentRepository,
			outboxProducer,
			uow as UnitOfWork,
			commandBus,
			queryBus,
		);

		const result = await handler.execute(
			new CreatePaymentIntentCommand({
				orderId: 'order-1',
				simulateOutcome: 'SUCCEEDED',
				simulateDelaySeconds: 3,
			}),
		);

		expect(queryExecuteMock).toHaveBeenCalledWith(
			expect.any(GetOrderQuery),
		);
		expect(persisted).toHaveLength(1);
		expect(commandExecuteMock).toHaveBeenCalledTimes(1);
		expect(commandExecuteMock).toHaveBeenCalledWith(
			expect.any(AttachPaymentToOrderCommand),
		);
		expect(commandExecuteMock.mock.calls[0]?.[0]).toBeInstanceOf(
			AttachPaymentToOrderCommand,
		);

		expect(outboxPublishMock).toHaveBeenCalledTimes(1);
		const [event, options] = outboxPublishMock.mock.calls[0] as [
			PaymentWebhookSucceededEvent,
			{ delaySeconds: number; messageGroupId: string },
		];
		expect(event).toBeInstanceOf(PaymentWebhookSucceededEvent);
		expect(options).toEqual({ delaySeconds: 3, messageGroupId: 'order-1' });
		expect(result.scheduled.eventType).toBe(
			PaymentWebhookSucceededEvent.eventType,
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

		const queryBus = {
			execute: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-2',
					amount: 500,
					currency: 'KRW',
				}),
			),
		} as unknown as QueryBus;

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
		const commandBus = {
			execute: jest.fn(() => Promise.resolve(undefined)),
		} as unknown as CommandBus;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new CreatePaymentIntentHandler(
			paymentRepository,
			outboxProducer,
			uow as UnitOfWork,
			commandBus,
			queryBus,
		);

		const result = await handler.execute(
			new CreatePaymentIntentCommand({
				orderId: 'order-2',
				simulateOutcome: 'FAILED',
			}),
		);

		expect(result.scheduled.eventType).toBe(
			PaymentWebhookFailedEvent.eventType,
		);
		expect(outboxPublishMock.mock.calls[0][0]).toBeInstanceOf(
			PaymentWebhookFailedEvent,
		);
	});
});
