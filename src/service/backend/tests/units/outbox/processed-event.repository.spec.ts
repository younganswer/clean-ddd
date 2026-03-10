import { ProcessedEventRepository } from '@/modules/outbox/idempotency/infrastructure/processed-event.repository';
import { ProcessedEventMapper } from '@/modules/outbox/idempotency/infrastructure/processed-event.mapper';
import { ProcessedEventSchema } from '@/modules/outbox/idempotency/infrastructure/processed-event.schema';

type ClaimInsertPayload = {
	uuid: string;
	createdAt: Date;
	updatedAt: Date;
	consumerName: string;
	eventId: string;
};

type InsertFn = (
	entity: typeof ProcessedEventSchema,
	payload: ClaimInsertPayload,
) => Promise<void>;

describe('ProcessedEventRepository', () => {
	it('includes timestamps when claiming an event', async () => {
		const insertMock = jest
			.fn<ReturnType<InsertFn>, Parameters<InsertFn>>()
			.mockResolvedValue(undefined);
		const repository = new ProcessedEventRepository(
			{
				insert: insertMock,
			} as never,
			{} as ProcessedEventMapper,
		);

		const claimed = await repository.claim('OutboxConsumer', 'event-1');

		expect(claimed).toBe(true);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(insertMock.mock.calls[0]?.[0]).toBe(ProcessedEventSchema);

		const insertPayload = insertMock.mock.calls[0]?.[1];
		expect(insertPayload).toBeDefined();
		if (!insertPayload) {
			throw new Error('expected insert payload to be defined');
		}
		expect(insertPayload.consumerName).toBe('OutboxConsumer');
		expect(insertPayload.eventId).toBe('event-1');
		expect(insertPayload.createdAt).toBeInstanceOf(Date);
		expect(insertPayload.updatedAt).toBeInstanceOf(Date);
		expect(insertPayload.uuid).toEqual(expect.any(String));
		expect(insertPayload.createdAt).toBe(insertPayload.updatedAt);
	});

	it('returns false on unique conflict during claim', async () => {
		const duplicateError: Error & { code: string } = new Error(
			'duplicate key value violates unique constraint',
		);
		duplicateError.code = '23505';
		const insertMock = jest
			.fn<ReturnType<InsertFn>, Parameters<InsertFn>>()
			.mockRejectedValue(duplicateError);
		const repository = new ProcessedEventRepository(
			{
				insert: insertMock,
			} as never,
			{} as ProcessedEventMapper,
		);

		await expect(
			repository.claim('OutboxConsumer', 'event-1'),
		).resolves.toBe(false);
	});
});
