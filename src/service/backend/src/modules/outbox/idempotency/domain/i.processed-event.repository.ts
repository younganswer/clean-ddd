import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';

type ProcessedEventFindableFields = Pick<
	ProcessedEvent,
	'consumerName' | 'eventId'
>;

export type ProcessedEventFindCriteria = Partial<ProcessedEventFindableFields>;

export interface IProcessedEventRepository {
	findByCriteria(
		criteria: ProcessedEventFindCriteria,
	): Promise<ProcessedEvent[]>;
	claim(event: ProcessedEvent): Promise<boolean>;
	persist(event: ProcessedEvent): Promise<void>;
	release(event: ProcessedEvent): Promise<void>;
}

export const IProcessedEventRepositorySymbol = Symbol(
	'I_PROCESSED_EVENT_REPOSITORY',
);
