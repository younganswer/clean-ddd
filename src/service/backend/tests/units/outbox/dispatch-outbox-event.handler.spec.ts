import { DispatchOutboxEventHandler } from '@/modules/outbox/application/commands/handlers/dispatch-outbox-event.handler';
import { DispatchOutboxEventCommand } from '@/shared/outbox/commands/dispatch-outbox-event.command';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import type { IOutboxQueuePort } from '@/shared/outbox/domain/i.outbox-queue.port';
import type { UnitOfWork } from '@/lib/database/unit-of-work';

describe('DispatchOutboxEventHandler', () => {
	it('marks event as published after successful enqueue', async () => {
		const event = OutboxEvent.create({
			eventType: 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED',
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PENDING,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const findByIdMock = jest.fn(() => Promise.resolve(event));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: findByIdMock,
			getById: jest.fn(() => Promise.resolve(event)),
			findDispatchable: jest.fn(() => Promise.resolve([event])),
			findRecent: jest.fn(() => Promise.resolve([event])),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};
		const enqueueMock = jest.fn(() => Promise.resolve(undefined));
		const outboxQueue: IOutboxQueuePort = {
			enqueue: enqueueMock,
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const handler = new DispatchOutboxEventHandler(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await handler.execute(
			new DispatchOutboxEventCommand({
				outboxId: event.id,
				messageGroupId: 'order-1',
			}),
		);

		expect(enqueueMock).toHaveBeenCalledWith(event.id, {
			messageGroupId: 'order-1',
		});
		expect(event.status).toBe(OutboxEventStatus.PUBLISHED);
		expect(persistMock).toHaveBeenCalled();
	});

	it('marks event as failed when enqueue throws', async () => {
		const event = OutboxEvent.create({
			eventType: 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED',
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PENDING,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const findByIdMock = jest.fn(() => Promise.resolve(event));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: findByIdMock,
			getById: jest.fn(() => Promise.resolve(event)),
			findDispatchable: jest.fn(() => Promise.resolve([event])),
			findRecent: jest.fn(() => Promise.resolve([event])),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};
		const outboxQueue: IOutboxQueuePort = {
			enqueue: jest.fn(() => {
				throw new Error('enqueue failed');
			}),
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const handler = new DispatchOutboxEventHandler(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await handler.execute(
			new DispatchOutboxEventCommand({
				outboxId: event.id,
				messageGroupId: 'order-1',
			}),
		);

		expect(event.status).toBe(OutboxEventStatus.FAILED);
		expect(event.attempt).toBe(1);
		expect(event.lastError).toBe('enqueue failed');
		expect(persistMock).toHaveBeenCalled();
	});
});
