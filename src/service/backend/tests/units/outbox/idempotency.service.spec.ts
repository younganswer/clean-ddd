import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';
import type { IProcessedEventRepository } from '@/modules/outbox/idempotency/domain/i.processed-event.repository';

describe('IdempotencyService', () => {
	it('creates a processed event domain entity before claiming', async () => {
		const claimMock = jest
			.fn<Promise<boolean>, [ProcessedEvent]>()
			.mockResolvedValue(true);
		const releaseMock = jest
			.fn<Promise<void>, [ProcessedEvent]>()
			.mockResolvedValue(undefined);
		const repository: IProcessedEventRepository = {
			findByCriteria: jest.fn(() => Promise.resolve([])),
			claim: claimMock,
			persist: jest.fn(() => Promise.resolve(undefined)),
			release: releaseMock,
		};
		const service = new IdempotencyService(repository);

		await expect(service.claim('OutboxConsumer', 'event-1')).resolves.toBe(
			true,
		);

		expect(claimMock).toHaveBeenCalledTimes(1);
		expect(claimMock.mock.calls[0]?.[0]).toBeInstanceOf(ProcessedEvent);

		const processedEvent = claimMock.mock.calls[0]?.[0];
		if (!processedEvent) {
			throw new Error('expected processed event to be defined');
		}

		expect(processedEvent.consumerName).toBe('OutboxConsumer');
		expect(processedEvent.eventId).toBe('event-1');
	});

	it('creates a processed event domain entity before releasing', async () => {
		const claimMock = jest
			.fn<Promise<boolean>, [ProcessedEvent]>()
			.mockResolvedValue(true);
		const releaseMock = jest
			.fn<Promise<void>, [ProcessedEvent]>()
			.mockResolvedValue(undefined);
		const repository: IProcessedEventRepository = {
			findByCriteria: jest.fn(() => Promise.resolve([])),
			claim: claimMock,
			persist: jest.fn(() => Promise.resolve(undefined)),
			release: releaseMock,
		};
		const service = new IdempotencyService(repository);

		await expect(
			service.release('OutboxConsumer', 'event-1'),
		).resolves.toBeUndefined();

		expect(releaseMock).toHaveBeenCalledTimes(1);
		expect(releaseMock.mock.calls[0]?.[0]).toBeInstanceOf(ProcessedEvent);

		const processedEvent = releaseMock.mock.calls[0]?.[0];
		if (!processedEvent) {
			throw new Error('expected processed event to be defined');
		}

		expect(processedEvent.consumerName).toBe('OutboxConsumer');
		expect(processedEvent.eventId).toBe('event-1');
	});
});
