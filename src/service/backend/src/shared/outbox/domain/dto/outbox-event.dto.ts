import { OutboxEventStatus } from '@/shared/outbox/domain/outbox-event-status';

export interface OutboxEventDto {
	uuid?: string;
	eventType: string;
	payload: Record<string, unknown>;
	status?: OutboxEventStatus;
	attempt?: number;
	recordedAt?: Date;
	nextAttemptAt?: Date;
	lockedUntil?: Date | null;
	publishedAt?: Date | null;
	lastError?: string | null;
}
