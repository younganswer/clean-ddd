import { ModuleRef } from '@nestjs/core';
import { EventBus } from '@nestjs/cqrs';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import type { IOutboxRepository } from '@/shared/outbox/domain/i.outbox.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';
import { PaymentWebhookSucceededEvent } from '@/shared/payments';

describe('OutboxConsumer idempotency', () => {
	it('does not execute side effect on duplicate message', async () => {
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

		const knownHandler = { handle: jest.fn(async () => undefined) };
		const moduleRef = {
			get: jest.fn(() => knownHandler),
		} as unknown as ModuleRef;

		const idempotency = {
			claim: jest.fn(async () => false),
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

		expect(outboxEvent.status).toBe(OutboxEventStatus.CONSUMED);
		expect(knownHandler.handle).not.toHaveBeenCalled();
		expect(eventBus.publish).not.toHaveBeenCalled();
		expect(idempotency.release).not.toHaveBeenCalled();
	});
});
