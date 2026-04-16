import { Test } from '@nestjs/testing';
import { CqrsModule, CommandBus } from '@nestjs/cqrs';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxKnownHandlerRegistryService } from '@/modules/outbox/application/outbox-known-handler.registry.service';
import { IOutboxRepositorySymbol } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type { IOutboxRepository } from '@/shared/outbox/domain/repositories/i.outbox.repository';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';
import { IdempotencyService } from '@/modules/outbox/idempotency/application/idempotency.service';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domain/readers/i.order.reader';
import { OrderStatus } from '@/modules/ordering/domain/enums/order-status.enum';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { PaymentFulfillmentRequestedHandler } from '@/saga-orchestrator/fulfillment/payment-fulfillment-requested.event-handler';
import { ReserveInventoryForOrderCommand } from '@/modules/inventory/application/commands/reserve-inventory-for-order.command';
import { CreateShipmentForOrderCommand } from '@/modules/shipping/application/commands/create-shipment-for-order.command';
import { ReleaseInventoryForOrderCommand } from '@/modules/inventory/application/commands/release-inventory-for-order.command';

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
		const found = this.events.get(id);
		if (!found) {
			throw new Error(`outbox event not found: ${id}`);
		}
		return Promise.resolve(found);
	}

	findDispatchable(
		options: RepositoryPageOptions<OutboxEvent> & { now: Date },
	): Promise<OutboxEvent[]> {
		const { limit, offset = 0 } = options;
		return Promise.resolve(
			[...this.events.values()].slice(offset, offset + limit),
		);
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

describe('PaymentFulfillmentRequested outbox compensation (integration)', () => {
	it('executes release compensation via outbox consume flow when shipment creation fails', async () => {
		const repository = new InMemoryOutboxRepository();
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentFulfillmentRequestedEvent.eventType,
			payload: {
				orderId: 'order-fulfillment-1',
				aggregateId: 'order-fulfillment-1',
				sequence: 1,
				eventVersion: 1,
				occurredAt: '2026-04-02T00:00:00.000Z',
			},
			status: OutboxEventStatus.PUBLISHED,
		});
		repository.add(outboxEvent);

		const orderReader = {
			findById: jest.fn(() =>
				Promise.resolve({
					orderId: 'order-fulfillment-1',
					userId: 'user-1',
					status: OrderStatus.PAID,
					amount: 1000,
					currency: 'KRW',
					items: [{ sku: 'sku-a', quantity: 1 }],
					paymentId: 'payment-1',
				}),
			),
		} as unknown as IOrderReader;

		const claimMock = jest.fn<Promise<boolean>, [string, string]>(() =>
			Promise.resolve(true),
		);
		const releaseMock = jest.fn(() => Promise.resolve(undefined));
		const idempotency = {
			claim: claimMock,
			release: releaseMock,
		} as unknown as IdempotencyService;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(
				work: (em: never) => Promise<T>,
			): Promise<T> => await work(undefined as never),
		};

		const moduleRef = await Test.createTestingModule({
			imports: [CqrsModule],
			providers: [
				PaymentFulfillmentRequestedHandler,
				OutboxConsumer,
				OutboxConsumeStateMachine,
				{ provide: IOrderReaderSymbol, useValue: orderReader },
				{ provide: UnitOfWork, useValue: uow },
				{
					provide: IOutboxRepositorySymbol,
					useValue: repository,
				},
				{ provide: IdempotencyService, useValue: idempotency },
				{
					provide: OutboxKnownHandlerRegistryService,
					useFactory: (handler: PaymentFulfillmentRequestedHandler) =>
						({
							find: (eventType: string) =>
								eventType ===
								PaymentFulfillmentRequestedEvent.eventType
									? {
											eventType:
												PaymentFulfillmentRequestedEvent.eventType,
											handlerName:
												'PaymentFulfillmentRequestedHandler',
											handler,
										}
									: undefined,
						}) as unknown as OutboxKnownHandlerRegistryService,
					inject: [PaymentFulfillmentRequestedHandler],
				},
			],
		}).compile();

		await moduleRef.init();

		const commandBus = moduleRef.get(CommandBus);
		const commandExecuteSpy = jest
			.spyOn(commandBus, 'execute')
			.mockImplementation((command: object) => {
				if (command instanceof ReserveInventoryForOrderCommand) {
					return Promise.resolve(undefined);
				}
				if (command instanceof CreateShipmentForOrderCommand) {
					return Promise.reject(new Error('shipment failed'));
				}
				if (command instanceof ReleaseInventoryForOrderCommand) {
					return Promise.resolve(undefined);
				}

				return Promise.resolve(undefined);
			});

		const consumer = moduleRef.get(OutboxConsumer);

		await expect(
			consumer.consumeRawMessage({
				body: JSON.stringify({ outboxId: outboxEvent.id }),
			}),
		).rejects.toThrow('shipment failed');

		expect(commandExecuteSpy).toHaveBeenCalledTimes(3);
		const calls = commandExecuteSpy.mock.calls as unknown[][];
		expect(calls[0]?.[0]).toBeInstanceOf(ReserveInventoryForOrderCommand);
		expect(calls[1]?.[0]).toBeInstanceOf(CreateShipmentForOrderCommand);
		expect(calls[2]?.[0]).toBeInstanceOf(ReleaseInventoryForOrderCommand);

		const claimedEventId = claimMock.mock.calls.at(0)?.[1];
		if (!claimedEventId) {
			throw new Error('idempotency key was not claimed');
		}
		expect(releaseMock).toHaveBeenCalledWith(
			'OutboxConsumer',
			claimedEventId,
		);

		const updated = await repository.getById(outboxEvent.id);
		expect(updated.status).toBe(OutboxEventStatus.FAILED);
		expect(updated.attempt).toBe(1);
	});
});
