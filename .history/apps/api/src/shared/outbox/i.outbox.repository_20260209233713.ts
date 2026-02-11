import { OutboxEventDto } from './dto/outbox-event.dto';

export interface IOutboxRepository {
  save(event: OutboxEventDto): Promise<string>;

  findDispatchable(limit: number, now: Date): Promise<OutboxEventDto[]>;
  lock(uuid: string, lockedUntil: Date): Promise<boolean>;

  markAsPublished(uuid: string): Promise<void>;
  recordFailure(uuid: string, error: string, nextAttemptAt: Date): Promise<void>;
}

export const IOutboxRepositorySymbol = Symbol('I_OUTBOX_REPOSITORY');
