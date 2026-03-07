import { Test } from '@nestjs/testing';
import { CqrsModule, CommandBus, EventBus } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import { HandlePaymentWebhookFailedCommand } from '@/shared/payments/commands/handle-payment-webhook-failed.command';
import { HandlePaymentWebhookSucceededCommand } from '@/shared/payments/commands/handle-payment-webhook-succeeded.command';
import {
	PaymentStatus,
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domains/repositories/i.payment.repository';
import {
	PaymentWebhookFailedHandler,
	PaymentWebhookSucceededHandler,
} from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { HandlePaymentWebhookFailedHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-failed.handler';
import { HandlePaymentWebhookSucceededHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-succeeded.handler';

describe('PaymentWebhookEvent multi-handler wiring (integration)', () => {
	it('dispatches both saga and ordering handlers on succeeded event publish', async () => {
		const payments = new Map<string, PaymentIntent>();
		const payment = PaymentIntent.create({
			orderId: 'order-100',
			amount: 3000,
			currency: 'KRW',
		});
		payments.set(payment.id, payment);
		const paymentPersistMock = jest.fn((entity: PaymentIntent) => {
			payments.set(entity.id, entity);
			return Promise.resolve();
		});

		const paymentRepository: IPaymentRepository = {
			persist: paymentPersistMock,
			findById: jest.fn((id: string) =>
				Promise.resolve(payments.get(id) ?? null),
			),
			getById: jest.fn((id: string) => {
				const found = payments.get(id);
				if (!found) {
					return Promise.reject(
						new Error(`payment not found: ${id}`),
					);
				}
				return Promise.resolve(found);
			}),
			findRecent: jest.fn(() => Promise.resolve([])),
		};

		const outboxPublishMock = jest.fn(() => Promise.resolve('outbox-1'));
		const outboxProducer = {
			publish: outboxPublishMock,
		} as unknown as OutboxProducer;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const moduleRef = await Test.createTestingModule({
			imports: [CqrsModule],
			providers: [
				PaymentWebhookSucceededHandler,
				PaymentWebhookFailedHandler,
				HandlePaymentWebhookSucceededHandler,
				HandlePaymentWebhookFailedHandler,
				MarkOrderPaidOnPaymentWebhookSucceededHandler,
				{
					provide: IPaymentRepositorySymbol,
					useValue: paymentRepository,
				},
				{ provide: OutboxProducer, useValue: outboxProducer },
				{ provide: UnitOfWork, useValue: uow },
			],
		}).compile();

		await moduleRef.init();

		const commandBus = moduleRef.get(CommandBus);
		const succeededHandler = moduleRef.get(
			HandlePaymentWebhookSucceededHandler,
		);
		const failedHandler = moduleRef.get(HandlePaymentWebhookFailedHandler);
		const commandExecuteSpy = jest
			.spyOn(commandBus, 'execute')
			.mockImplementation(async (command: object) => {
				if (command instanceof HandlePaymentWebhookSucceededCommand) {
					await succeededHandler.execute(command);
					return;
				}
				if (command instanceof HandlePaymentWebhookFailedCommand) {
					await failedHandler.execute(command);
					return;
				}
				if (command instanceof MarkOrderPaidCommand) {
					return;
				}
			});
		const eventBus = moduleRef.get(EventBus);

		await eventBus.publish(
			new PaymentWebhookSucceededEvent({
				orderId: 'order-100',
				paymentId: payment.id,
			}),
		);

		for (let i = 0; i < 20; i += 1) {
			if (
				paymentPersistMock.mock.calls.length > 0 &&
				outboxPublishMock.mock.calls.length > 0 &&
				commandExecuteSpy.mock.calls.length > 0
			) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(paymentPersistMock).toHaveBeenCalledTimes(1);
		expect(outboxPublishMock).toHaveBeenCalledTimes(1);
		expect(commandExecuteSpy).toHaveBeenCalledWith(
			expect.any(HandlePaymentWebhookSucceededCommand),
		);
		expect(commandExecuteSpy).toHaveBeenCalledWith(
			expect.any(MarkOrderPaidCommand),
		);
	});

	it('handles failed event without publishing fulfillment or dispatching order-paid command', async () => {
		const payments = new Map<string, PaymentIntent>();
		const payment = PaymentIntent.create({
			orderId: 'order-200',
			amount: 5000,
			currency: 'KRW',
		});
		payments.set(payment.id, payment);
		const paymentPersistMock = jest.fn((entity: PaymentIntent) => {
			payments.set(entity.id, entity);
			return Promise.resolve();
		});

		const paymentRepository: IPaymentRepository = {
			persist: paymentPersistMock,
			findById: jest.fn((id: string) =>
				Promise.resolve(payments.get(id) ?? null),
			),
			getById: jest.fn((id: string) => {
				const found = payments.get(id);
				if (!found) {
					return Promise.reject(
						new Error(`payment not found: ${id}`),
					);
				}
				return Promise.resolve(found);
			}),
			findRecent: jest.fn(() => Promise.resolve([])),
		};

		const outboxPublishMock = jest.fn(() => Promise.resolve('outbox-2'));
		const outboxProducer = {
			publish: outboxPublishMock,
		} as unknown as OutboxProducer;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const moduleRef = await Test.createTestingModule({
			imports: [CqrsModule],
			providers: [
				PaymentWebhookSucceededHandler,
				PaymentWebhookFailedHandler,
				HandlePaymentWebhookSucceededHandler,
				HandlePaymentWebhookFailedHandler,
				MarkOrderPaidOnPaymentWebhookSucceededHandler,
				{
					provide: IPaymentRepositorySymbol,
					useValue: paymentRepository,
				},
				{ provide: OutboxProducer, useValue: outboxProducer },
				{ provide: UnitOfWork, useValue: uow },
			],
		}).compile();

		await moduleRef.init();

		const commandBus = moduleRef.get(CommandBus);
		const succeededHandler = moduleRef.get(
			HandlePaymentWebhookSucceededHandler,
		);
		const failedHandler = moduleRef.get(HandlePaymentWebhookFailedHandler);
		const commandExecuteSpy = jest
			.spyOn(commandBus, 'execute')
			.mockImplementation(async (command: object) => {
				if (command instanceof HandlePaymentWebhookSucceededCommand) {
					await succeededHandler.execute(command);
					return;
				}
				if (command instanceof HandlePaymentWebhookFailedCommand) {
					await failedHandler.execute(command);
					return;
				}
				if (command instanceof MarkOrderPaidCommand) {
					return;
				}
			});
		const eventBus = moduleRef.get(EventBus);

		await eventBus.publish(
			new PaymentWebhookFailedEvent({
				orderId: 'order-200',
				paymentId: payment.id,
			}),
		);

		for (let i = 0; i < 20; i += 1) {
			if (paymentPersistMock.mock.calls.length > 0) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(paymentPersistMock).toHaveBeenCalledTimes(1);
		expect(outboxPublishMock).toHaveBeenCalledTimes(0);
		expect(commandExecuteSpy).toHaveBeenCalledWith(
			expect.any(HandlePaymentWebhookFailedCommand),
		);
		expect(commandExecuteSpy).not.toHaveBeenCalledWith(
			expect.any(MarkOrderPaidCommand),
		);

		const updated = await paymentRepository.getById(payment.id);
		expect(updated.status).toBe(PaymentStatus.FAILED);
	});
});
