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

type ExecuteFn = (
	query: string,
	params: unknown[],
) => Promise<Array<{ uuid: string }>>;

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
		const executeMock = jest
			.fn<ReturnType<ExecuteFn>, Parameters<ExecuteFn>>()
			.mockResolvedValue([{ uuid: processedEvent.id }]);
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
				getConnection: jest.fn(() => ({ execute: executeMock })),
			} as never,
			mapper as ProcessedEventMapper,
		);

		const claimed = await repository.claim(processedEvent);

		expect(claimed).toBe(true);
		expect(executeMock).toHaveBeenCalledTimes(1);
		expect(mapper.toSchema).toHaveBeenCalledWith(processedEvent);

		const query = executeMock.mock.calls[0]?.[0];
		expect(query).toContain('insert into "processed_events"');
		expect(query).toContain(
			'on conflict ("consumer_name", "event_id") do nothing',
		);

		const queryParams = executeMock.mock.calls[0]?.[1];
		expect(queryParams).toBeDefined();
		if (!queryParams) {
			throw new Error('expected query params to be defined');
		}
		expect(queryParams[0]).toBe(processedEvent.id);
		expect(queryParams[1]).toBe(processedEvent.consumerName);
		expect(queryParams[2]).toBe(processedEvent.eventId);
		expect(queryParams[3]).toBeInstanceOf(Date);
		expect(queryParams[4]).toBeInstanceOf(Date);
		expect(queryParams[3]).toBe(queryParams[4]);
	});

	it('returns false on unique conflict during claim', async () => {
		const processedEvent = ProcessedEvent.create({
			consumerName: 'OutboxConsumer',
			eventId: 'event-1',
		});
		const executeMock = jest
			.fn<ReturnType<ExecuteFn>, Parameters<ExecuteFn>>()
			.mockResolvedValue([]);
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
				getConnection: jest.fn(() => ({ execute: executeMock })),
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
