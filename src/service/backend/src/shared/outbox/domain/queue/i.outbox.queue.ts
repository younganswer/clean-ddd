export type OutboxDispatchSource = 'dispatcher' | 'sweeper' | 'sweeper-direct';

export interface IOutboxQueue {
	enqueue(
		outboxId: string,
		options?: {
			delaySeconds?: number;
			messageGroupId?: string;
			source?: OutboxDispatchSource;
		},
	): Promise<void>;
}

export const IOutboxQueueSymbol = Symbol('I_OUTBOX_QUEUE_PORT');
