import { Injectable } from '@nestjs/common';
import {
	createRetryAt,
	resolveOutboxMaxAttempts,
} from '@/modules/outbox/application/outbox-error.util';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

@Injectable()
export class OutboxConsumeStateMachine {
	private static readonly RETRY_DELAY_MS = 60_000;
	private readonly maxAttempts: number;

	constructor() {
		this.maxAttempts = resolveOutboxMaxAttempts(
			process.env.OUTBOX_MAX_ATTEMPTS,
		);
	}

	isDispatchable(event: OutboxEvent): boolean {
		return (
			event.status === OutboxEventStatus.PUBLISHED ||
			event.status === OutboxEventStatus.FAILED ||
			event.status === OutboxEventStatus.PENDING
		);
	}

	markDuplicateClaimConflict(event: OutboxEvent): void {
		event.recordFailure(
			'duplicate idempotency claim; keeping event retryable',
			createRetryAt(OutboxConsumeStateMachine.RETRY_DELAY_MS),
			{ maxAttempts: this.maxAttempts },
		);
	}

	markUnknownEventTypeFailure(event: OutboxEvent): void {
		event.recordFailure(
			`unknown eventType=${event.eventType}`,
			createRetryAt(OutboxConsumeStateMachine.RETRY_DELAY_MS),
			{ maxAttempts: this.maxAttempts },
		);
	}

	markDispatchFailure(event: OutboxEvent, message: string): void {
		event.recordFailure(
			message,
			createRetryAt(OutboxConsumeStateMachine.RETRY_DELAY_MS),
			{ maxAttempts: this.maxAttempts },
		);
	}

	markOutOfOrderDiscarded(event: OutboxEvent): void {
		event.markConsumed();
	}

	markConsumed(event: OutboxEvent): void {
		event.markConsumed();
	}
}
