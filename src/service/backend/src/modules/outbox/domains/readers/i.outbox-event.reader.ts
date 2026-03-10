import type { OutboxEventResult } from '@/modules/outbox/domains/readers/outbox-event.result';

export const IOutboxEventReaderSymbol = Symbol('IOutboxEventReader');

export interface IOutboxEventReader {
	findRecent(limit: number): Promise<OutboxEventResult[]>;
}
