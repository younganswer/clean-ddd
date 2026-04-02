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

describe('OutboxConsumer idempotency', () => {
	it('does not execute side effect on duplicate message', async () => {
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PUBLISHED,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const unlockMock = jest.fn(() => Promise.resolve(undefined));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(outboxEvent)),
			getById: jest.fn(() => Promise.resolve(outboxEvent)),
			findDispatchable: jest.fn(() => Promise.resolve([outboxEvent])),
			findRecent: jest.fn(() => Promise.resolve([outboxEvent])),
			hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: unlockMock,
		};

		const knownHandlerHandle = jest.fn(() => Promise.resolve(undefined));
		const knownHandlerRegistry = {
			find: jest.fn(() => ({
				eventType: PaymentWebhookSucceededEvent.eventType,
				handlerName: 'KnownHandler',
				handler: { handle: knownHandlerHandle },
			})),
		} as unknown as OutboxKnownHandlerRegistryService;

		const claimMock = jest.fn(() => Promise.resolve(false));
		const releaseMock = jest.fn(() => Promise.resolve(undefined));
		const idempotency = {
			claim: claimMock,
			release: releaseMock,
		} as unknown as IdempotencyService;

		const publishMock = jest.fn();
		const eventBus = {
			publish: publishMock,
		} as unknown as EventBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const consumer = new OutboxConsumer(
			outboxRepository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
			knownHandlerRegistry,
			new OutboxConsumeStateMachine(),
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: outboxEvent.id }),
		});

		expect(outboxEvent.status).toBe(OutboxEventStatus.FAILED);
		expect(knownHandlerHandle).not.toHaveBeenCalled();
		expect(publishMock).not.toHaveBeenCalled();
		expect(releaseMock).not.toHaveBeenCalled();
		expect(persistMock).toHaveBeenCalled();
		expect(unlockMock).toHaveBeenCalledWith(outboxEvent.id);
	});

	it('uses deterministic idempotency key when aggregate metadata exists', async () => {
		const buildConsumer = (event: OutboxEvent) => {
			const outboxRepository: IOutboxRepository = {
				persist: jest.fn(() => Promise.resolve(undefined)),
				findById: jest.fn(() => Promise.resolve(event)),
				getById: jest.fn(() => Promise.resolve(event)),
				findDispatchable: jest.fn(() => Promise.resolve([event])),
				findRecent: jest.fn(() => Promise.resolve([event])),
				hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
				lock: jest.fn(() => Promise.resolve(true)),
				unlock: jest.fn(() => Promise.resolve(undefined)),
			};

			const claimMock = jest.fn<Promise<boolean>, [string, string]>(() =>
				Promise.resolve(false),
			);
			const idempotency = {
				claim: claimMock,
				release: jest.fn(() => Promise.resolve(undefined)),
			} as unknown as IdempotencyService;

			const knownHandlerRegistry = {
				find: jest.fn(() => undefined),
			} as unknown as OutboxKnownHandlerRegistryService;

			const consumer = new OutboxConsumer(
				outboxRepository,
				idempotency,
				{ publish: jest.fn() } as unknown as EventBus,
				{
					transaction: async <T>(
						work: (em: never) => Promise<T>,
					): Promise<T> => await work(undefined as never),
				} as unknown as UnitOfWork,
				knownHandlerRegistry,
				new OutboxConsumeStateMachine(),
			);

			return {
				consumer,
				claimMock,
			};
		};

		const payload = {
			orderId: 'order-1',
			paymentId: 'payment-1',
			aggregateId: 'order-1',
			sequence: 11,
			eventVersion: 2,
		};

		const firstEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload,
			status: OutboxEventStatus.PUBLISHED,
		});
		const first = buildConsumer(firstEvent);
		await first.consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: firstEvent.id }),
		});
		const firstIdempotencyEventId = first.claimMock.mock.calls.at(0)?.[1];

		const secondEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload,
			status: OutboxEventStatus.PUBLISHED,
		});
		const second = buildConsumer(secondEvent);
		await second.consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: secondEvent.id }),
		});
		const secondIdempotencyEventId = second.claimMock.mock.calls.at(0)?.[1];

		if (!firstIdempotencyEventId || !secondIdempotencyEventId) {
			throw new Error('idempotency key was not claimed');
		}
		expect(firstIdempotencyEventId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
		expect(firstIdempotencyEventId).not.toBe(firstEvent.id);
		expect(secondIdempotencyEventId).toBe(firstIdempotencyEventId);
	});

	it('discards out-of-order event when newer consumed event already exists', async () => {
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload: {
				orderId: 'order-1',
				paymentId: 'payment-1',
				aggregateId: 'order-1',
				sequence: 3,
				eventVersion: 1,
			},
			status: OutboxEventStatus.PUBLISHED,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const hasConsumedNewerEventMock = jest.fn(() => Promise.resolve(true));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(outboxEvent)),
			getById: jest.fn(() => Promise.resolve(outboxEvent)),
			findDispatchable: jest.fn(() => Promise.resolve([outboxEvent])),
			findRecent: jest.fn(() => Promise.resolve([outboxEvent])),
			hasConsumedNewerEvent: hasConsumedNewerEventMock,
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};

		const knownHandlerHandle = jest.fn(() => Promise.resolve(undefined));
		const knownHandlerRegistry = {
			find: jest.fn(() => ({
				eventType: PaymentWebhookSucceededEvent.eventType,
				handlerName: 'KnownHandler',
				handler: { handle: knownHandlerHandle },
			})),
		} as unknown as OutboxKnownHandlerRegistryService;

		const claimMock = jest.fn(() => Promise.resolve(true));
		const releaseMock = jest.fn(() => Promise.resolve(undefined));
		const idempotency = {
			claim: claimMock,
			release: releaseMock,
		} as unknown as IdempotencyService;

		const eventBus = {
			publish: jest.fn(),
		} as unknown as EventBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const consumer = new OutboxConsumer(
			outboxRepository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
			knownHandlerRegistry,
			new OutboxConsumeStateMachine(),
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: outboxEvent.id }),
		});

		expect(outboxEvent.status).toBe(OutboxEventStatus.CONSUMED);
		expect(knownHandlerHandle).not.toHaveBeenCalled();
		expect(claimMock).not.toHaveBeenCalled();
		expect(releaseMock).not.toHaveBeenCalled();
		expect(persistMock).toHaveBeenCalled();
		expect(hasConsumedNewerEventMock).toHaveBeenCalledWith({
			eventType: PaymentWebhookSucceededEvent.eventType,
			aggregateId: 'order-1',
			eventVersion: 1,
			sequence: 3,
		});
	});
});
