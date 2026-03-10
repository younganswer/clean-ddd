import { Inject, Injectable } from '@nestjs/common';
import {
	IOutboxRepositorySymbol,
	type IOutboxRepository,
} from '@/shared/outbox/domain/repositories/i.outbox.repository';
import {
	IOutboxEventReaderSymbol,
	type IOutboxEventReader,
} from '@/modules/outbox/domains/readers/i.outbox-event.reader';
import type { OutboxEventResult } from '@/modules/outbox/domains/readers/outbox-event.result';

@Injectable()
export class OutboxEventReader implements IOutboxEventReader {
	constructor(
		@Inject(IOutboxRepositorySymbol)
		private readonly outboxRepository: IOutboxRepository,
	) {}

	async findRecent(limit: number): Promise<OutboxEventResult[]> {
		const events = await this.outboxRepository.findRecent(limit);
		return events.map((event) => ({
			outboxId: event.id,
			eventType: event.eventType,
			payload: event.payload,
			status: event.status,
			recordedAt: event.recordedAt,
		}));
	}
}

export const OutboxEventReaderProvider = {
	provide: IOutboxEventReaderSymbol,
	useClass: OutboxEventReader,
};
