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

		const outboxRepository: IOutboxRepository = {
			persist: jest.fn(async () => undefined),
			findById: jest.fn(async () => event),
			getById: jest.fn(async () => event),
			findDispatchable: jest.fn(async () => [event]),
			findRecent: jest.fn(async () => [event]),
			lock: jest.fn(async () => true),
			unlock: jest.fn(async () => undefined),
		};
		const outboxQueue: IOutboxQueuePort = {
			enqueue: jest.fn(async () => undefined),
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(work: () => Promise<T>): Promise<T> =>
				await work(),
		};

		const handler = new DispatchOutboxEventHandler(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await handler.execute(
			new DispatchOutboxEventCommand(event.id, 'order-1'),
		);

		expect(outboxQueue.enqueue).toHaveBeenCalledWith(event.id, {
			messageGroupId: 'order-1',
		});
		expect(event.status).toBe(OutboxEventStatus.PUBLISHED);
		expect(outboxRepository.persist).toHaveBeenCalled();
	});

	it('marks event as failed when enqueue throws', async () => {
		const event = OutboxEvent.create({
			eventType: 'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED',
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PENDING,
		});

		const outboxRepository: IOutboxRepository = {
			persist: jest.fn(async () => undefined),
			findById: jest.fn(async () => event),
			getById: jest.fn(async () => event),
			findDispatchable: jest.fn(async () => [event]),
			findRecent: jest.fn(async () => [event]),
			lock: jest.fn(async () => true),
			unlock: jest.fn(async () => undefined),
		};
		const outboxQueue: IOutboxQueuePort = {
			enqueue: jest.fn(async () => {
				throw new Error('enqueue failed');
			}),
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(work: () => Promise<T>): Promise<T> =>
				await work(),
		};

		const handler = new DispatchOutboxEventHandler(
			outboxRepository,
			outboxQueue,
			uow as UnitOfWork,
		);

		await handler.execute(
			new DispatchOutboxEventCommand(event.id, 'order-1'),
		);

		expect(event.status).toBe(OutboxEventStatus.FAILED);
		expect(event.attempt).toBe(1);
		expect(event.lastError).toBe('enqueue failed');
		expect(outboxRepository.persist).toHaveBeenCalled();
	});
});
