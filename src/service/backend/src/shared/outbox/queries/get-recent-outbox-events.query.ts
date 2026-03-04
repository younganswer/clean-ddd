import { Query } from '@nestjs/cqrs';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status';

export type RecentOutboxEventView = {
	outboxId: string;
	eventType: string;
	payload: Record<string, unknown>;
	status: OutboxEventStatus;
	recordedAt: Date;
};

export class GetRecentOutboxEventsQuery extends Query<GetRecentOutboxEventsResult> {
	constructor(readonly limit: number = 200) {
		super();
	}
}

export class GetRecentOutboxEventsResult {
	constructor(readonly events: RecentOutboxEventView[]) {}
}
