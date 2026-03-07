import { ProcessedEvent } from '@/shared/idempotency/domain/entities/processed-event.entity';

export interface IProcessedEventRepository {
	find(consumerName: string, eventId: string): Promise<ProcessedEvent | null>;
	persist(event: ProcessedEvent): Promise<void>;
	release(consumerName: string, eventId: string): Promise<void>;
}

export const IProcessedEventRepositorySymbol = Symbol(
	'I_PROCESSED_EVENT_REPOSITORY',
);
