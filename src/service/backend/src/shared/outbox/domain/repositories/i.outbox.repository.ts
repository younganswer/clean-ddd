import { OutboxEvent } from '@/shared/outbox/domain/entities/outbox-event.entity';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';

export interface OutboxConsumedOrderingCriteria {
	eventType: string;
	aggregateId: string;
	eventVersion: number;
	sequence: number;
}

export interface IOutboxRepository {
	persist(event: OutboxEvent): Promise<void>;
	findById(id: string): Promise<OutboxEvent | null>;
	getById(
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<OutboxEvent>;

	findDispatchable(
		options: RepositoryPageOptions<OutboxEvent> & { now: Date },
	): Promise<OutboxEvent[]>;
	findRecent(
		options: RepositoryPageOptions<OutboxEvent>,
	): Promise<OutboxEvent[]>;
	hasConsumedNewerEvent(
		criteria: OutboxConsumedOrderingCriteria,
	): Promise<boolean>;
	lock(uuid: string, lockedUntil: Date): Promise<boolean>;
	unlock(uuid: string): Promise<void>;
}

export const IOutboxRepositorySymbol = Symbol('I_OUTBOX_REPOSITORY');
