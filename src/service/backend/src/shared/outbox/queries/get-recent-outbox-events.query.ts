import { Query } from '@nestjs/cqrs';
import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export type RecentOutboxEventView = {
	outboxId: string;
	eventType: string;
	payload: Record<string, unknown>;
	status: OutboxEventStatus;
	recordedAt: Date;
};

export class GetRecentOutboxEventsQuery extends Query<GetRecentOutboxEventsResult> {
	readonly limit: number;

	constructor(limit: number = 200) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 200,
		});
	}
}

export class GetRecentOutboxEventsResult {
	constructor(readonly events: RecentOutboxEventView[]) {}
}
