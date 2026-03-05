import { CommandBus } from '@nestjs/cqrs';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	CreatePaymentIntentCommand,
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import type { IOrderReader } from '@/shared/ordering/readers/i.order.reader';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

describe('CreatePaymentIntentHandler', () => {
	it('creates payment using IOrderReader and schedules succeeded webhook event', async () => {
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

		const findOrderByIdMock = jest.fn(() =>
			Promise.resolve({
				orderId: 'order-1',
				userId: 'user-1',
				status: OrderStatus.PENDING_PAYMENT,
				amount: 1200,
				currency: 'KRW',
				items: [{ sku: 'sku-1', quantity: 2 }],
				paymentId: null,
			}),
		);

		const orderReader: IOrderReader = {
			findById: findOrderByIdMock,
			findRecent: () => Promise.resolve([]),
			findByUserId: () => Promise.resolve([]),
			countAll: () => Promise.resolve(0),
		};

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
		} as unknown as OutboxProducer;

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
			orderReader,
			uow as UnitOfWork,
			outboxProducer,
			commandBus,
		);

		const result = await handler.execute(
			new CreatePaymentIntentCommand({
				orderId: 'order-1',
				simulateOutcome: 'SUCCEEDED',
				simulateDelaySeconds: 3,
			}),
		);

		expect(findOrderByIdMock).toHaveBeenCalledWith('order-1');
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

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-2',
					userId: 'user-2',
					status: OrderStatus.PENDING_PAYMENT,
					amount: 500,
					currency: 'KRW',
					items: [{ sku: 'sku-2', quantity: 1 }],
					paymentId: null,
				}),
			),
			findRecent: jest.fn(() => Promise.resolve([])),
			findByUserId: jest.fn(() => Promise.resolve([])),
			countAll: jest.fn(() => Promise.resolve(0)),
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
		} as unknown as OutboxProducer;
		const commandBus = {
			execute: jest.fn(() => Promise.resolve(undefined)),
		} as unknown as CommandBus;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new CreatePaymentIntentHandler(
			paymentRepository,
			orderReader,
			uow as UnitOfWork,
			outboxProducer,
			commandBus,
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
