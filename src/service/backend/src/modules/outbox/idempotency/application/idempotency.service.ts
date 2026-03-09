import { Inject, Injectable } from '@nestjs/common';
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
		return await this.processedEventRepository.claim(consumerName, eventId);
	}

	async release(consumerName: string, eventId: string): Promise<void> {
		await this.processedEventRepository.release(consumerName, eventId);
	}
}
