import { RequestContext } from '@mikro-orm/core';
import { CommandBus, EventBus, QueryBus } from '@nestjs/cqrs';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';
import { DispatchOutboxEventHandler } from '@/modules/outbox/application/commands/handlers/dispatch-outbox-event.handler';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { DispatchOutboxEventCommand } from '@/shared/outbox/commands/dispatch-outbox-event.command';
import {
	GetPendingOutboxEventsResult,
	GetPendingOutboxEventsQuery,
} from '@/shared/outbox/queries/get-pending-outbox-events.query';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import type { IOutboxQueuePort } from '@/shared/outbox/domain/i.outbox-queue.port';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { IdempotencyService } from '@/modules/outbox/idempotency/idempotency.service';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';

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

	findDispatchable(limit: number, now: Date): Promise<OutboxEvent[]> {
		const filtered = [...this.events.values()]
			.filter((event) => {
				const unlocked = !event.lockedUntil || event.lockedUntil < now;
				const retryReady = event.nextAttemptAt <= now;
				const dispatchableStatus =
					event.status === OutboxEventStatus.PENDING ||
					event.status === OutboxEventStatus.FAILED;
				return unlocked && retryReady && dispatchableStatus;
			})
			.slice(0, limit);

		return Promise.resolve(filtered);
	}

	findRecent(limit: number): Promise<OutboxEvent[]> {
		return Promise.resolve([...this.events.values()].slice(0, limit));
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
		const queue: IOutboxQueuePort = {
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
				const events = await repository.findDispatchable(
					query.limit,
					query.now,
				);
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
