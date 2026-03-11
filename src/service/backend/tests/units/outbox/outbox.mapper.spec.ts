import { OutboxMapper } from '@/modules/outbox/infrastructure/mappers/outbox.mapper';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

describe('OutboxMapper', () => {
	it('maps mutable outbox state fields to schema', () => {
		const recordedAt = new Date('2026-03-11T03:37:20.000Z');
		const nextAttemptAt = new Date('2026-03-11T03:42:20.000Z');
		const publishedAt = new Date('2026-03-11T03:38:13.000Z');
		const event = OutboxEvent.rehydrate({
			uuid: 'outbox-1',
			eventType: 'PAYMENT_WEBHOOK.PAYMENT_FULFILLMENT_REQUESTED',
			payload: { orderId: 'order-1' },
			recordedAt,
			status: OutboxEventStatus.CONSUMED,
			attempt: 3,
			nextAttemptAt,
			lockedUntil: null,
			publishedAt,
			lastError: 'previous failure',
		});

		const schema = new OutboxMapper().toSchema(event);

		expect(schema.createdAt).toEqual(recordedAt);
		expect(schema.status).toBe(OutboxEventStatus.CONSUMED);
		expect(schema.attempt).toBe(3);
		expect(schema.nextAttemptAt).toEqual(nextAttemptAt);
		expect(schema.lockedUntil).toBeNull();
		expect(schema.publishedAt).toEqual(publishedAt);
		expect(schema.lastError).toBe('previous failure');
	});

	it('accepts outbox state through schema constructor', () => {
		const nextAttemptAt = new Date('2026-03-11T03:42:20.000Z');
		const schema = new OutboxEventSchema({
			uuid: 'outbox-2',
			eventType: 'PAYMENT.PAYMENT_INTENT_CREATED',
			payload: { paymentId: 'payment-1' },
			status: OutboxEventStatus.FAILED,
			attempt: 2,
			nextAttemptAt,
			lastError: 'enqueue failed',
		});

		expect(schema.status).toBe(OutboxEventStatus.FAILED);
		expect(schema.attempt).toBe(2);
		expect(schema.nextAttemptAt).toEqual(nextAttemptAt);
		expect(schema.lastError).toBe('enqueue failed');
	});
});
