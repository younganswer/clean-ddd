import { OutboxEventStatus } from '../outbox-event-status';

export interface OutboxEventDto {
  uuid?: string;
  eventType: string;
  payload: Record<string, unknown>;
  status?: OutboxEventStatus;
  attempt?: number;
  nextAttemptAt?: Date;
  lockedUntil?: Date | null;
  createdAt?: Date;
  publishedAt?: Date | null;
  lastError?: string | null;
}
