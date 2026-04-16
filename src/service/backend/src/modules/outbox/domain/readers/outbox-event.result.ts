import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status.enum';

export type OutboxEventResult = {
	outboxId: string;
	eventType: string;
	payload: Record<string, unknown>;
	status: OutboxEventStatus;
	recordedAt: Date;
};
