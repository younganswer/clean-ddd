import { OutboxConsumeStateMachine } from '@/modules/outbox/application/outbox-consume.state-machine';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

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
		const terminalFailed = OutboxEvent.create({
			eventType: 'test.terminal-failed',
			payload: {},
			status: OutboxEventStatus.TERMINAL_FAILED,
		});

		expect(stateMachine.isDispatchable(consumed)).toBe(false);
		expect(stateMachine.isDispatchable(terminalFailed)).toBe(false);
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

	it('marks duplicate claim as retryable failure instead of consumed', () => {
		const event = OutboxEvent.create({
			eventType: 'duplicate.claim',
			payload: {},
			status: OutboxEventStatus.PUBLISHED,
		});

		stateMachine.markDuplicateClaimConflict(event);

		expect(event.status).toBe(OutboxEventStatus.FAILED);
		expect(event.lastError).toContain('duplicate idempotency claim');
		expect(event.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
	});

	it('marks event as terminal failed when max attempts is exceeded', () => {
		const previousMaxAttempts = process.env.OUTBOX_MAX_ATTEMPTS;
		try {
			process.env.OUTBOX_MAX_ATTEMPTS = '2';
			const machine = new OutboxConsumeStateMachine();
			const event = OutboxEvent.create({
				eventType: 'terminal.failure',
				payload: {},
				status: OutboxEventStatus.PUBLISHED,
			});

			machine.markDispatchFailure(event, 'first failure');
			expect(event.status).toBe(OutboxEventStatus.FAILED);
			expect(event.attempt).toBe(1);

			machine.markDispatchFailure(event, 'second failure');
			expect(event.status).toBe(OutboxEventStatus.TERMINAL_FAILED);
			expect(event.attempt).toBe(2);
		} finally {
			if (previousMaxAttempts === undefined) {
				delete process.env.OUTBOX_MAX_ATTEMPTS;
			} else {
				process.env.OUTBOX_MAX_ATTEMPTS = previousMaxAttempts;
			}
		}
	});
});
