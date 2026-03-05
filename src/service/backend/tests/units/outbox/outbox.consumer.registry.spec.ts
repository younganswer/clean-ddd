import { EventBus } from '@nestjs/cqrs';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { PaymentWebhookSucceededEvent } from '@/shared/payments';

describe('OutboxConsumer (registry dispatch)', () => {
	it('dispatches known event via registry handler', async () => {
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
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: unlockMock,
		};

		const handlerHandle = jest.fn(() => Promise.resolve(undefined));
		const knownHandlerFindMock = jest.fn(() => ({
			eventType: PaymentWebhookSucceededEvent.eventType,
			handlerName: 'PaymentWebhookSucceededHandler',
			handler: { handle: handlerHandle },
		}));
		const knownHandlerRegistry = {
			find: knownHandlerFindMock,
		} as unknown as OutboxKnownHandlerRegistryService;

		const claimMock = jest.fn(() => Promise.resolve(true));
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
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: outboxEvent.id }),
		});

		expect(knownHandlerFindMock).toHaveBeenCalledWith(
			PaymentWebhookSucceededEvent.eventType,
		);
		expect(handlerHandle).toHaveBeenCalledTimes(1);
		expect(publishMock).not.toHaveBeenCalled();
		expect(outboxEvent.status).toBe(OutboxEventStatus.CONSUMED);
		expect(persistMock).toHaveBeenCalled();
	});

	it('publishes via EventBus when known handler is not registered', async () => {
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
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: unlockMock,
		};

		const knownHandlerRegistry = {
			find: jest.fn(() => undefined),
		} as unknown as OutboxKnownHandlerRegistryService;

		const claimMock2 = jest.fn(() => Promise.resolve(true));
		const releaseMock2 = jest.fn(() => Promise.resolve(undefined));
		const idempotency = {
			claim: claimMock2,
			release: releaseMock2,
		} as unknown as IdempotencyService;

		const publishMock2 = jest.fn();
		const eventBus = {
			publish: publishMock2,
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
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: outboxEvent.id }),
		});

		expect(outboxEvent.status).toBe(OutboxEventStatus.CONSUMED);
		expect(publishMock2).toHaveBeenCalledTimes(1);
		expect(releaseMock2).not.toHaveBeenCalled();
		expect(unlockMock).not.toHaveBeenCalled();
	});
});
