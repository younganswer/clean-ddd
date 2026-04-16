import type { OutboxEventResult } from '@/modules/outbox/domain/readers/outbox-event.result';

export class GetRecentOutboxEventsResult {
	constructor(readonly events: OutboxEventResult[]) {}
}
