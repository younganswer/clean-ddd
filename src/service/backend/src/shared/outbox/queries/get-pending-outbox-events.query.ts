import { Query } from '@nestjs/cqrs';
import type { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import { toBoundedInt, toDate } from '@/shared/cqrs/input-normalizer';

export class GetPendingOutboxEventsQuery extends Query<GetPendingOutboxEventsResult> {
	readonly limit: number;

	readonly now: Date;

	constructor(limit: number = 10, now: Date = new Date()) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 10,
		});
		this.now = toDate(now, new Date());
	}
}

export class GetPendingOutboxEventsResult {
	constructor(readonly events: OutboxEvent[]) {}
}
