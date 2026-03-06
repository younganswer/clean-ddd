import { Injectable } from '@nestjs/common';
import { createRetryAt } from '@/modules/outbox/application/outbox-error.util';
import { OutboxEvent, OutboxEventStatus } from '@/shared/outbox';

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

	markDuplicateClaimConsumed(event: OutboxEvent): void {
		event.markConsumed();
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
