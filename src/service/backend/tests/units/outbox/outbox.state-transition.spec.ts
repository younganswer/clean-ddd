import { RequestContext } from '@mikro-orm/core';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { DispatchOutboxEventHandler } from '@/modules/outbox/application/commands/handlers/dispatch-outbox-event.handler';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import {
	GetPendingOutboxEventsResult,
	GetPendingOutboxEventsQuery,
} from '@/modules/outbox/application/queries/get-pending-outbox-events.query';
import type { IOutboxRepository } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type { IOutboxQueue } from '@/shared/outbox/domain/queue/i.outbox.queue';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { CreateShipmentForOrderRequestedEvent } from '@/contracts/shipping/events/create-shipment-for-order-requested.event';

class InMemoryOutboxRepository implements IOutboxRepository {
	private readonly events = new Map<string, OutboxEvent>();

	add(event: OutboxEvent): void {
		this.events.set(event.id, event);
	}

	persist(event: OutboxEvent): Promise<void> {
		this.events.set(event.id, event);
		return Promise.resolve();
	}

	findById(id: string): Promise<OutboxEvent | null> {
		return Promise.resolve(this.events.get(id) ?? null);
	}

	getById(
		id: string,
		_options?: RepositoryGetByIdOptions,
	): Promise<OutboxEvent> {
		const event = this.events.get(id);
		if (!event) throw new Error(`outbox event not found: ${id}`);
		return Promise.resolve(event);
	}

	findDispatchable(
		options: RepositoryPageOptions<OutboxEvent> & { now: Date },
	): Promise<OutboxEvent[]> {
		const { limit, offset = 0, now } = options;
		const filtered = [...this.events.values()]
			.filter((event) => {
				const unlocked = !event.lockedUntil || event.lockedUntil < now;
				const retryReady = event.nextAttemptAt <= now;
				const dispatchableStatus =
					event.status === OutboxEventStatus.PENDING ||
					event.status === OutboxEventStatus.FAILED;
				return unlocked && retryReady && dispatchableStatus;
			})
			.slice(offset, offset + limit);

		return Promise.resolve(filtered);
	}

	findRecent(
		options: RepositoryPageOptions<OutboxEvent>,
	): Promise<OutboxEvent[]> {
		const { limit, offset = 0 } = options;
		return Promise.resolve(
			[...this.events.values()].slice(offset, offset + limit),
		);
	}

	hasConsumedNewerEvent(criteria: {
		eventType: string;
		aggregateId: string;
		eventVersion: number;
		sequence: number;
	}): Promise<boolean> {
		const toBoundedInt = (
			value: unknown,
			fallback: number,
			minimum: number,
		): number => {
			const parsed = Number(value);
			if (!Number.isFinite(parsed) || parsed < minimum) return fallback;
			return Math.trunc(parsed);
		};

		const hasNewer = [...this.events.values()].some((event) => {
			if (event.status !== OutboxEventStatus.CONSUMED) return false;
			if (event.eventType !== criteria.eventType) return false;

			const aggregateId =
				typeof event.payload.aggregateId === 'string'
					? event.payload.aggregateId.trim()
					: '';
			if (aggregateId !== criteria.aggregateId) return false;

			const eventVersion = toBoundedInt(event.payload.eventVersion, 1, 1);
			const sequence = toBoundedInt(event.payload.sequence, 0, 0);

			return (
				eventVersion > criteria.eventVersion ||
				(eventVersion === criteria.eventVersion &&
					sequence > criteria.sequence)
			);
		});

		return Promise.resolve(hasNewer);
	}

	lock(uuid: string, lockedUntil: Date): Promise<boolean> {
		const event = this.events.get(uuid);
		if (!event) return Promise.resolve(false);
		if (event.lockedUntil && event.lockedUntil >= new Date())
			return Promise.resolve(false);

		const next = OutboxEvent.rehydrate({
			uuid: event.id,
			eventType: event.eventType,
			payload: event.payload,
			recordedAt: event.recordedAt,
			status: event.status,
			attempt: event.attempt,
			nextAttemptAt: event.nextAttemptAt,
			lockedUntil,
			publishedAt: event.publishedAt,
			lastError: event.lastError,
		});
		this.events.set(uuid, next);
		return Promise.resolve(true);
	}

	unlock(uuid: string): Promise<void> {
		const event = this.events.get(uuid);
		if (!event) return Promise.resolve();

		const next = OutboxEvent.rehydrate({
			uuid: event.id,
			eventType: event.eventType,
			payload: event.payload,
			recordedAt: event.recordedAt,
			status: event.status,
			attempt: event.attempt,
			nextAttemptAt: event.nextAttemptAt,
			lockedUntil: null,
			publishedAt: event.publishedAt,
			lastError: event.lastError,
		});
		this.events.set(uuid, next);
		return Promise.resolve();
	}
}

describe('Outbox flow state transition', () => {
	it('transitions PENDING -> PUBLISHED -> CONSUMED', async () => {
		const repository = new InMemoryOutboxRepository();
		const enqueueMock = jest.fn(() => Promise.resolve(undefined));
		const queue: IOutboxQueue = {
			enqueue: enqueueMock,
		};
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const pendingEvent = OutboxEvent.create({
			eventType: CreateShipmentForOrderRequestedEvent.eventType,
			payload: { orderId: 'order-1' },
			status: OutboxEventStatus.PENDING,
			nextAttemptAt: new Date('2026-03-05T00:00:00.000Z'),
		});
		repository.add(pendingEvent);

		const dispatchHandler = new DispatchOutboxEventHandler(
			repository,
			queue,
			uow as UnitOfWork,
		);

		const queryBus: Pick<QueryBus, 'execute'> = {
			execute: async <
				TQuery extends GetPendingOutboxEventsQuery,
				TResult extends GetPendingOutboxEventsResult,
			>(
				query: TQuery,
			): Promise<TResult> => {
				const events = await repository.findDispatchable({
					limit: query.limit,
					now: query.now,
				});
				return new GetPendingOutboxEventsResult(events) as TResult;
			},
		};

		const commandBus: Pick<CommandBus, 'execute'> = {
			execute: async <
				TCommand extends DispatchOutboxEventCommand,
				TResult,
			>(
				command: TCommand,
			): Promise<TResult> => {
				await dispatchHandler.execute(command);
				return undefined as TResult;
			},
		};

		const orm = {
			em: {
				fork: () => ({}) as object,
			},
		};

		const requestContextSpy = jest
			.spyOn(RequestContext, 'create')
			.mockImplementation(
				async <TContext>(
					_context: object,
					next: () => Promise<TContext>,
				): Promise<TContext> => await next(),
			);

		const dispatcher = new OutboxDispatcher(
			orm as never,
			queryBus as QueryBus,
			commandBus as CommandBus,
		);

		const dispatchedCount = await dispatcher.dispatchPending(
			10,
			new Date('2026-03-05T00:00:01.000Z'),
		);
		expect(dispatchedCount).toBe(1);
		expect(enqueueMock).toHaveBeenCalledTimes(1);

		const publishedEvent = await repository.getById(pendingEvent.id);
		expect(publishedEvent.status).toBe(OutboxEventStatus.PUBLISHED);

		const knownHandlerHandle = jest.fn(() => Promise.resolve(undefined));
		const knownHandlerRegistry = {
			find: jest.fn(() => ({
				eventType: CreateShipmentForOrderRequestedEvent.eventType,
				handlerName: 'KnownHandler',
				handler: { handle: knownHandlerHandle },
			})),
		} as unknown as OutboxKnownHandlerRegistryService;
		const idempotency = {
			claim: jest.fn(() => Promise.resolve(true)),
			release: jest.fn(() => Promise.resolve(undefined)),
		} as unknown as IdempotencyService;
		const eventBus = { publish: jest.fn() } as unknown as EventBus;

		const consumer = new OutboxConsumer(
			repository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
			knownHandlerRegistry,
			new OutboxConsumeStateMachine(),
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: pendingEvent.id }),
		});

		const consumedEvent = await repository.getById(pendingEvent.id);
		expect(consumedEvent.status).toBe(OutboxEventStatus.CONSUMED);
		expect(knownHandlerHandle).toHaveBeenCalledTimes(1);

		requestContextSpy.mockRestore();
	});
});
