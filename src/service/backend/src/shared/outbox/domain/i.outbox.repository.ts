import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';

export interface IOutboxRepository {
	persist(event: OutboxEvent): Promise<void>;
	findById(uuid: string): Promise<OutboxEvent | null>;

	findDispatchable(limit: number, now: Date): Promise<OutboxEvent[]>;
	lock(uuid: string, lockedUntil: Date): Promise<boolean>;
	unlock(uuid: string): Promise<void>;
}

export const IOutboxRepositorySymbol = Symbol('I_OUTBOX_REPOSITORY');
