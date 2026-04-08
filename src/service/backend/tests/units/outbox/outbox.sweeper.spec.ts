/// <reference types="jest" />

import { OutboxSweeper } from '@/modules/outbox/application/outbox.sweeper';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import type { IOutboxRepository } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type { IOutboxQueue } from '@/shared/outbox/domain/queue/i.outbox.queue';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { OutboxDispatchSource } from '@/shared/outbox/domain/queue/outbox-dispatch-source.enum';

describe('OutboxSweeper', () => {
	it('enqueues and marks pending event as published', async () => {
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
			hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};

		const enqueueMock = jest.fn(() => Promise.resolve(undefined));
		const outboxQueue: IOutboxQueue = {
			enqueue: enqueueMock,
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const sweeper = new OutboxSweeper(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await expect(sweeper.sweepAndEnqueue(10)).resolves.toBe(1);

		expect(enqueueMock).toHaveBeenCalledWith(event.id, {
			messageGroupId: 'order-1',
			source: OutboxDispatchSource.SWEEPER,
		});
		expect(findByIdMock).toHaveBeenCalledWith(event.id);
		expect(event.status).toBe(OutboxEventStatus.PUBLISHED);
		expect(persistMock).toHaveBeenCalled();
	});

	it('skips non-dispatchable consumed event', async () => {
		const event = OutboxEvent.create({
			eventType: 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED',
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.CONSUMED,
		});

		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const findByIdMock = jest.fn(() => Promise.resolve(event));
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: findByIdMock,
			getById: jest.fn(() => Promise.resolve(event)),
			findDispatchable: jest.fn(() => Promise.resolve([event])),
			findRecent: jest.fn(() => Promise.resolve([event])),
			hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
			lock: jest.fn(() => Promise.resolve(true)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};

		const enqueueMock = jest.fn(() => Promise.resolve(undefined));
		const outboxQueue: IOutboxQueue = {
			enqueue: enqueueMock,
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const sweeper = new OutboxSweeper(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await expect(sweeper.sweepAndEnqueue(10)).resolves.toBe(0);

		expect(enqueueMock).not.toHaveBeenCalled();
		expect(findByIdMock).not.toHaveBeenCalled();
		expect(persistMock).not.toHaveBeenCalled();
		expect(event.status).toBe(OutboxEventStatus.CONSUMED);
	});
});
