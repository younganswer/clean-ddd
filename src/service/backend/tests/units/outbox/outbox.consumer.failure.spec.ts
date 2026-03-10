import { EventBus } from '@nestjs/cqrs';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import type { IOutboxRepository } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';

describe('OutboxConsumer failure path', () => {
	it('persists failed state and unlocks when handler throws', async () => {
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PUBLISHED,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const unlockMock = jest.fn(() => Promise.resolve(undefined));
		const findByIdMock = jest.fn(() => Promise.resolve(outboxEvent));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: findByIdMock,
			getById: jest.fn(() => Promise.resolve(outboxEvent)),
			findDispatchable: jest.fn(() => Promise.resolve([outboxEvent])),
			findRecent: jest.fn(() => Promise.resolve([outboxEvent])),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: unlockMock,
		};

		const handlerError = new Error('known handler failed');
		const knownHandlerRegistry = {
			find: jest.fn(() => ({
				eventType: PaymentWebhookSucceededEvent.eventType,
				handlerName: 'KnownHandler',
				handler: {
					handle: jest.fn(() => Promise.reject(handlerError)),
				},
			})),
		} as unknown as OutboxKnownHandlerRegistryService;

		const releaseMock = jest.fn(() => Promise.resolve(undefined));
		const idempotency = {
			claim: jest.fn(() => Promise.resolve(true)),
			release: releaseMock,
		} as unknown as IdempotencyService;

		const eventBus = {
			publish: jest.fn(),
		} as unknown as EventBus;

		const transactionOptions: Array<{ requiresNew?: boolean } | undefined> =
			[];
		const transactionMock: UnitOfWork['transaction'] = async <T>(
			work: (em: never) => Promise<T>,
			options?: { requiresNew?: boolean },
		): Promise<T> => {
			transactionOptions.push(options);
			return await work(undefined as never);
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: transactionMock,
		};

		const consumer = new OutboxConsumer(
			outboxRepository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
			knownHandlerRegistry,
			new OutboxConsumeStateMachine(),
		);

		await expect(
			consumer.consumeRawMessage({
				body: JSON.stringify({ outboxId: outboxEvent.id }),
			}),
		).rejects.toThrow('known handler failed');

		expect(outboxEvent.status).toBe(OutboxEventStatus.FAILED);
		expect(persistMock).toHaveBeenCalled();
		expect(releaseMock).toHaveBeenCalledWith(
			'OutboxConsumer',
			outboxEvent.id,
		);
		expect(unlockMock).not.toHaveBeenCalled();
		expect(findByIdMock).toHaveBeenCalledTimes(2);
		expect(transactionOptions).toHaveLength(2);
		expect(transactionOptions[1]).toEqual({
			requiresNew: true,
		});
	});
});
