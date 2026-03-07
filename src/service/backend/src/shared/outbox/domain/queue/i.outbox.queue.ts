export interface IOutboxQueue {
	enqueue(
		outboxId: string,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<void>;
}

export const IOutboxQueueSymbol = Symbol('I_OUTBOX_QUEUE_PORT');
