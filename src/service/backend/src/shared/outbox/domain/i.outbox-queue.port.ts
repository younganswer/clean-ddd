export interface IOutboxQueuePort {
	enqueue(
		outboxId: string,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<void>;
}

export const IOutboxQueuePortSymbol = Symbol('I_OUTBOX_QUEUE_PORT');
