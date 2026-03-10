import { Injectable } from '@nestjs/common';
import { createRetryAt } from '@/modules/outbox/application/outbox-error.util';
import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

@Injectable()
export class OutboxConsumeStateMachine {
	private static readonly RETRY_DELAY_MS = 60_000;

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
		);
	}

	markUnknownEventTypeFailure(event: OutboxEvent): void {
		event.recordFailure(
			`unknown eventType=${event.eventType}`,
			createRetryAt(OutboxConsumeStateMachine.RETRY_DELAY_MS),
		);
	}

	markDispatchFailure(event: OutboxEvent, message: string): void {
		event.recordFailure(
			message,
			createRetryAt(OutboxConsumeStateMachine.RETRY_DELAY_MS),
		);
	}

	markConsumed(event: OutboxEvent): void {
		event.markConsumed();
	}
}
