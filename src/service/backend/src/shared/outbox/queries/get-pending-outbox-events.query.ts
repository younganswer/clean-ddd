import { Query } from '@nestjs/cqrs';
import type { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';

export class GetPendingOutboxEventsQuery extends Query<GetPendingOutboxEventsResult> {
	constructor(
		readonly limit: number = 10,
		readonly now: Date = new Date(),
	) {
		super();
	}
}

export class GetPendingOutboxEventsResult {
	constructor(readonly events: OutboxEvent[]) {}
}
