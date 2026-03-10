import type { OutboxEventResult } from '@/modules/outbox/domains/readers/outbox-event.result';

export class GetRecentOutboxEventsResult {
	constructor(readonly events: OutboxEventResult[]) {}
}
