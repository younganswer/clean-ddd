import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';

export interface IProcessedEventRepository {
	find(consumerName: string, eventId: string): Promise<ProcessedEvent | null>;
	claim(consumerName: string, eventId: string): Promise<boolean>;
	persist(event: ProcessedEvent): Promise<void>;
	release(consumerName: string, eventId: string): Promise<void>;
}

export const IProcessedEventRepositorySymbol = Symbol(
	'I_PROCESSED_EVENT_REPOSITORY',
);
