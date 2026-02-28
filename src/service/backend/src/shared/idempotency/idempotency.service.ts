import { Inject, Injectable } from '@nestjs/common';
import { ProcessedEvent } from '@/shared/idempotency/domain/entities/processed-event.entity';
import {
	IProcessedEventRepositorySymbol,
	type IProcessedEventRepository,
} from '@/shared/idempotency/domain/i.processed-event.repository';

@Injectable()
export class IdempotencyService {
	constructor(
		@Inject(IProcessedEventRepositorySymbol)
		private readonly repository: IProcessedEventRepository,
	) {}

	async claim(consumerName: string, eventId: string): Promise<boolean> {
		const claimEvent = ProcessedEvent.create({
			consumerName,
			eventId,
		});

		try {
			await this.repository.persist(claimEvent);

			return true;
		} catch (error: unknown) {
			// unique constraint violation -> already processed
			const maybeError =
				typeof error === 'object' && error !== null
					? (error as Record<string, unknown>)
					: undefined;
			const rawCode = maybeError?.code;
			const rawMessage = maybeError?.message;
			const code =
				typeof rawCode === 'string' || typeof rawCode === 'number'
					? String(rawCode)
					: '';
			const message = typeof rawMessage === 'string' ? rawMessage : '';
			if (
				code === '23505' ||
				message.toLowerCase().includes('unique') ||
				message.toLowerCase().includes('duplicate')
			) {
				return false;
			}
			throw error;
		}
	}

	async release(consumerName: string, eventId: string): Promise<void> {
		await this.repository.release(consumerName, eventId);
	}
}
