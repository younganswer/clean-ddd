import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status';

export type RecentOutboxEventResult = {
	outboxId: string;
	eventType: string;
	payload: Record<string, unknown>;
	status: OutboxEventStatus;
	recordedAt: Date;
};

export class GetRecentOutboxEventsResult {
	constructor(readonly events: RecentOutboxEventResult[]) {}
}
