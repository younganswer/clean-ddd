import { ModuleRef } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { PaymentWebhookSucceededEvent } from '@/shared/payments';

describe('OutboxConsumer (registry dispatch)', () => {
	it('dispatches known event via registry handler', async () => {
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PUBLISHED,
		});

		const outboxRepository: IOutboxRepository = {
			persist: jest.fn(async () => undefined),
			findById: jest.fn(async () => outboxEvent),
			getById: jest.fn(async () => outboxEvent),
			findDispatchable: jest.fn(async () => [outboxEvent]),
			findRecent: jest.fn(async () => [outboxEvent]),
			lock: jest.fn(async () => true),
			unlock: jest.fn(async () => undefined),
		};

		const handler = { handle: jest.fn(async () => undefined) };
		const moduleRef = {
			get: jest.fn(() => handler),
		} as unknown as ModuleRef;

		const idempotency = {
			claim: jest.fn(async () => true),
			release: jest.fn(async () => undefined),
		} as unknown as IdempotencyService;

		const eventBus = {
			publish: jest.fn(),
		} as unknown as EventBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(work: () => Promise<T>): Promise<T> =>
				await work(),
		};

		const consumer = new OutboxConsumer(
			moduleRef,
			outboxRepository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
		);

		await consumer.consumeRawMessage({
			body: JSON.stringify({ outboxId: outboxEvent.id }),
		});

		expect(moduleRef.get).toHaveBeenCalled();
		expect(handler.handle).toHaveBeenCalledTimes(1);
		expect(eventBus.publish).not.toHaveBeenCalled();
		expect(outboxEvent.status).toBe(OutboxEventStatus.CONSUMED);
	});

	it('fails when known event handler provider is missing', async () => {
		const outboxEvent = OutboxEvent.create({
			eventType: PaymentWebhookSucceededEvent.eventType,
			payload: { orderId: 'order-1', paymentId: 'payment-1' },
			status: OutboxEventStatus.PUBLISHED,
		});

		const outboxRepository: IOutboxRepository = {
			persist: jest.fn(async () => undefined),
			findById: jest.fn(async () => outboxEvent),
			getById: jest.fn(async () => outboxEvent),
			findDispatchable: jest.fn(async () => [outboxEvent]),
			findRecent: jest.fn(async () => [outboxEvent]),
			lock: jest.fn(async () => true),
			unlock: jest.fn(async () => undefined),
		};

		const moduleRef = {
			get: jest.fn(() => undefined),
		} as unknown as ModuleRef;

		const idempotency = {
			claim: jest.fn(async () => true),
			release: jest.fn(async () => undefined),
		} as unknown as IdempotencyService;

		const eventBus = {
			publish: jest.fn(),
		} as unknown as EventBus;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: async <T>(work: () => Promise<T>): Promise<T> =>
				await work(),
		};

		const consumer = new OutboxConsumer(
			moduleRef,
			outboxRepository,
			idempotency,
			eventBus,
			uow as UnitOfWork,
		);

		await expect(
			consumer.consumeRawMessage({
				body: JSON.stringify({ outboxId: outboxEvent.id }),
			}),
		).rejects.toThrow('provider not found');

		expect(outboxEvent.status).toBe(OutboxEventStatus.FAILED);
		expect(idempotency.release).toHaveBeenCalledTimes(1);
		expect(outboxRepository.unlock).toHaveBeenCalledTimes(1);
	});
});
