import type { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';

export class GetPendingOutboxEventsQuery {
	constructor(
		readonly limit: number = 10,
		readonly now: Date = new Date(),
	) {}
}

export class GetPendingOutboxEventsResult {
	constructor(readonly events: OutboxEvent[]) {}
}
