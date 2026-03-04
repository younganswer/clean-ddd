import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export interface IOutboxRepository {
	persist(event: OutboxEvent): Promise<void>;
	findById(id: string): Promise<OutboxEvent | null>;
	getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OutboxEvent>;

	findDispatchable(limit: number, now: Date): Promise<OutboxEvent[]>;
	findRecent(limit: number): Promise<OutboxEvent[]>;
	lock(uuid: string, lockedUntil: Date): Promise<boolean>;
	unlock(uuid: string): Promise<void>;
}

export const IOutboxRepositorySymbol = Symbol('I_OUTBOX_REPOSITORY');
