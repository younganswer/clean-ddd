import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import type { IOutboxRepository } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';

class ProducerSpecEvent {
	static readonly eventType = 'OUTBOX_PRODUCER.SPEC_EVENT';

	constructor(
		public readonly orderId: string,
		public readonly paymentId: string,
	) {}
}

describe('OutboxProducer', () => {
	afterEach(() => {
		jest.useRealTimers();
	});

	it('emit: stores a pending outbox event', async () => {
		const persisted = new Array<unknown>();
		const persistMock = jest.fn((event: unknown) => {
			persisted.push(event);
			return Promise.resolve(undefined);
		});
		const outboxRepository: IOutboxRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(null)),
			getById: jest.fn(() => {
				throw new Error('not used');
			}),
			findDispatchable: jest.fn(() => Promise.resolve([])),
			findRecent: jest.fn(() => Promise.resolve([])),
			hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
			lock: jest.fn(() => Promise.resolve(false)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => {
				return await work(undefined as never);
			},
		};

		const producer = new OutboxProducer(
			outboxRepository,
			uow as UnitOfWork,
		);

		const outboxId = await producer.emit('EVENT.TYPE', { orderId: 'o-1' });

		expect(outboxId).toBeTruthy();
		expect(persistMock).toHaveBeenCalledTimes(1);

		const event = persisted[0] as {
			toPrimitives: () => {
				eventType: string;
				payload: Record<string, unknown>;
				status: OutboxEventStatus;
			};
		};
		const primitives = event.toPrimitives();
		expect(primitives.eventType).toBe('EVENT.TYPE');
		expect(primitives.payload).toEqual({ orderId: 'o-1' });
		expect(primitives.status).toBe(OutboxEventStatus.PENDING);
	});

	it('publish: applies delaySeconds to nextAttemptAt', async () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));

		let persistedEvent:
			| {
					toPrimitives: () => { nextAttemptAt: Date };
			  }
			| undefined;

		const outboxRepository: IOutboxRepository = {
			persist: jest.fn((event) => {
				persistedEvent = event as {
					toPrimitives: () => { nextAttemptAt: Date };
				};
				return Promise.resolve(undefined);
			}),
			findById: jest.fn(() => Promise.resolve(null)),
			getById: jest.fn(() => {
				throw new Error('not used');
			}),
			findDispatchable: jest.fn(() => Promise.resolve([])),
			findRecent: jest.fn(() => Promise.resolve([])),
			hasConsumedNewerEvent: jest.fn(() => Promise.resolve(false)),
			lock: jest.fn(() => Promise.resolve(false)),
			unlock: jest.fn(() => Promise.resolve(undefined)),
		};

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => {
				return await work(undefined as never);
			},
		};

		const producer = new OutboxProducer(
			outboxRepository,
			uow as UnitOfWork,
		);

		await producer.publish(new ProducerSpecEvent('o-1', 'p-1'), {
			delaySeconds: 30,
		});

		expect(persistedEvent).toBeDefined();
		const nextAttemptAt =
			persistedEvent?.toPrimitives().nextAttemptAt.getTime() ?? 0;
		expect(nextAttemptAt).toBe(
			new Date('2026-03-05T00:00:30.000Z').getTime(),
		);
	});
});
