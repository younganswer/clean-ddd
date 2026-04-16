import type { PageOptions } from '@/lib/database/repository-get-options';
import type { OutboxEventResult } from '@/modules/outbox/domain/readers/outbox-event.result';

export const IOutboxEventReaderSymbol = Symbol('IOutboxEventReader');

export interface IOutboxEventReader {
	findRecent(
		options: PageOptions<OutboxEventResult>,
	): Promise<OutboxEventResult[]>;
}
