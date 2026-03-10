import { ProcessedEventRepository } from '@/modules/outbox/idempotency/infrastructure/processed-event.repository';
import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';
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

type DeleteFn = (
	entity: typeof ProcessedEventSchema,
	criteria: Pick<ClaimInsertPayload, 'consumerName' | 'eventId'>,
) => Promise<number>;

type FindFn = (
	entity: typeof ProcessedEventSchema,
	criteria: Partial<Pick<ClaimInsertPayload, 'consumerName' | 'eventId'>>,
) => Promise<ProcessedEventSchema[]>;

describe('ProcessedEventRepository', () => {
	it('includes timestamps when claiming an event', async () => {
		const processedEvent = ProcessedEvent.create({
			consumerName: 'OutboxConsumer',
			eventId: 'event-1',
		});
		const insertMock = jest
			.fn<ReturnType<InsertFn>, Parameters<InsertFn>>()
			.mockResolvedValue(undefined);
		const mapper = {
			toSchema: jest.fn(
				(event: ProcessedEvent) =>
					new ProcessedEventSchema({
						uuid: event.id,
						consumerName: event.consumerName,
						eventId: event.eventId,
					}),
			),
		} as Pick<ProcessedEventMapper, 'toSchema'>;
		const repository = new ProcessedEventRepository(
			{
				insert: insertMock,
			} as never,
			mapper as ProcessedEventMapper,
		);

		const claimed = await repository.claim(processedEvent);

		expect(claimed).toBe(true);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(insertMock.mock.calls[0]?.[0]).toBe(ProcessedEventSchema);
		expect(mapper.toSchema).toHaveBeenCalledWith(processedEvent);

		const insertPayload = insertMock.mock.calls[0]?.[1];
		expect(insertPayload).toBeDefined();
		if (!insertPayload) {
			throw new Error('expected insert payload to be defined');
		}
		expect(insertPayload.consumerName).toBe(processedEvent.consumerName);
		expect(insertPayload.eventId).toBe(processedEvent.eventId);
		expect(insertPayload.createdAt).toBeInstanceOf(Date);
		expect(insertPayload.updatedAt).toBeInstanceOf(Date);
		expect(insertPayload.uuid).toEqual(expect.any(String));
		expect(insertPayload.uuid).toBe(processedEvent.id);
		expect(insertPayload.createdAt).toBe(insertPayload.updatedAt);
	});

	it('returns false on unique conflict during claim', async () => {
		const processedEvent = ProcessedEvent.create({
			consumerName: 'OutboxConsumer',
			eventId: 'event-1',
		});
		const duplicateError = new Error(
			'duplicate key value violates unique constraint',
		) as Error & { code: string };
		duplicateError.code = '23505';
		const insertMock = jest
			.fn<ReturnType<InsertFn>, Parameters<InsertFn>>()
			.mockRejectedValue(duplicateError);
		const mapper = {
			toSchema: jest.fn(
				(event: ProcessedEvent) =>
					new ProcessedEventSchema({
						uuid: event.id,
						consumerName: event.consumerName,
						eventId: event.eventId,
					}),
			),
		} as Pick<ProcessedEventMapper, 'toSchema'>;
		const repository = new ProcessedEventRepository(
			{
				insert: insertMock,
			} as never,
			mapper as ProcessedEventMapper,
		);

		await expect(repository.claim(processedEvent)).resolves.toBe(false);
		expect(mapper.toSchema).toHaveBeenCalledWith(processedEvent);
	});

	it('finds rows by partial criteria', async () => {
		const row = new ProcessedEventSchema({
			uuid: 'processed-event-1',
			consumerName: 'OutboxConsumer',
			eventId: 'event-1',
		});
		const findMock = jest
			.fn<ReturnType<FindFn>, Parameters<FindFn>>()
			.mockResolvedValue([row]);
		const mapper = {
			toDomain: jest.fn((schema: ProcessedEventSchema) =>
				ProcessedEvent.rehydrate({
					uuid: schema.uuid,
					consumerName: schema.consumerName,
					eventId: schema.eventId,
				}),
			),
		} as Pick<ProcessedEventMapper, 'toDomain'>;
		const repository = new ProcessedEventRepository(
			{
				find: findMock,
			} as never,
			mapper as ProcessedEventMapper,
		);

		const found = await repository.findByCriteria({
			consumerName: '  OutboxConsumer  ',
		});

		expect(findMock).toHaveBeenCalledWith(ProcessedEventSchema, {
			consumerName: 'OutboxConsumer',
		});
		expect(mapper.toDomain).toHaveBeenCalledWith(row);
		expect(found).toHaveLength(1);
		expect(found[0]?.eventId).toBe('event-1');
	});

	it('returns an empty list when findByCriteria criteria is empty', async () => {
		const findMock = jest.fn<ReturnType<FindFn>, Parameters<FindFn>>();
		const repository = new ProcessedEventRepository(
			{
				find: findMock,
			} as never,
			{} as ProcessedEventMapper,
		);

		await expect(repository.findByCriteria({})).resolves.toEqual([]);
		expect(findMock).not.toHaveBeenCalled();
	});

	it('releases by mapped domain entity keys', async () => {
		const processedEvent = ProcessedEvent.create({
			consumerName: 'OutboxConsumer',
			eventId: 'event-1',
		});
		const deleteMock = jest
			.fn<ReturnType<DeleteFn>, Parameters<DeleteFn>>()
			.mockResolvedValue(1);
		const mapper = {
			toSchema: jest.fn(
				(event: ProcessedEvent) =>
					new ProcessedEventSchema({
						uuid: event.id,
						consumerName: event.consumerName,
						eventId: event.eventId,
					}),
			),
		} as Pick<ProcessedEventMapper, 'toSchema'>;
		const repository = new ProcessedEventRepository(
			{
				nativeDelete: deleteMock,
			} as never,
			mapper as ProcessedEventMapper,
		);

		await expect(
			repository.release(processedEvent),
		).resolves.toBeUndefined();

		expect(mapper.toSchema).toHaveBeenCalledWith(processedEvent);
		expect(deleteMock).toHaveBeenCalledWith(ProcessedEventSchema, {
			consumerName: processedEvent.consumerName,
			eventId: processedEvent.eventId,
		});
	});
});
