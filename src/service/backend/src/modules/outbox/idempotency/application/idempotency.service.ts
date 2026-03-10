import { Inject, Injectable } from '@nestjs/common';
import { ProcessedEvent } from '@/modules/outbox/idempotency/domain/entities/processed-event.entity';
import {
	IProcessedEventRepositorySymbol,
	type IProcessedEventRepository,
} from '@/modules/outbox/idempotency/domain/i.processed-event.repository';

@Injectable()
export class IdempotencyService {
	constructor(
		@Inject(IProcessedEventRepositorySymbol)
		private readonly processedEventRepository: IProcessedEventRepository,
	) {}

	async claim(consumerName: string, eventId: string): Promise<boolean> {
		const processedEvent = ProcessedEvent.create({
			consumerName,
			eventId,
		});

		return await this.processedEventRepository.claim(processedEvent);
	}

	async release(consumerName: string, eventId: string): Promise<void> {
		const processedEvent = ProcessedEvent.create({
			consumerName,
			eventId,
		});

		await this.processedEventRepository.release(processedEvent);
	}
}
