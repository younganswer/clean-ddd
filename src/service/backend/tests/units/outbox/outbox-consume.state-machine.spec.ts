import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxEvent, OutboxEventStatus } from '@/shared/outbox';

describe('OutboxConsumeStateMachine', () => {
	const stateMachine = new OutboxConsumeStateMachine();

	it('returns true for dispatchable statuses', () => {
		const pending = OutboxEvent.create({
			eventType: 'test.pending',
			payload: {},
			status: OutboxEventStatus.PENDING,
		});
		const published = OutboxEvent.create({
			eventType: 'test.published',
			payload: {},
			status: OutboxEventStatus.PUBLISHED,
		});
		const failed = OutboxEvent.create({
			eventType: 'test.failed',
			payload: {},
			status: OutboxEventStatus.FAILED,
		});

		expect(stateMachine.isDispatchable(pending)).toBe(true);
		expect(stateMachine.isDispatchable(published)).toBe(true);
		expect(stateMachine.isDispatchable(failed)).toBe(true);
	});

	it('returns false for non-dispatchable statuses', () => {
		const consumed = OutboxEvent.create({
			eventType: 'test.consumed',
			payload: {},
			status: OutboxEventStatus.CONSUMED,
		});

		expect(stateMachine.isDispatchable(consumed)).toBe(false);
	});

	it('marks unknown event type as retryable failure', () => {
		const event = OutboxEvent.create({
			eventType: 'unknown.type',
			payload: {},
			status: OutboxEventStatus.PUBLISHED,
		});

		stateMachine.markUnknownEventTypeFailure(event);

		expect(event.status).toBe(OutboxEventStatus.FAILED);
		expect(event.lastError).toContain('unknown eventType=unknown.type');
		expect(event.attempt).toBe(1);
		expect(event.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
	});
});
