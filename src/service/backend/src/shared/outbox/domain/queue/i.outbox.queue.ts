import { OutboxEnqueueSource } from '@/shared/outbox/domain/queue/outbox-dispatch-message';

export interface IOutboxQueue {
	enqueue(
		outboxId: string,
		options?: {
			delaySeconds?: number;
			messageGroupId?: string;
			source?: OutboxEnqueueSource;
		},
	): Promise<void>;
}

export const IOutboxQueueSymbol = Symbol('I_OUTBOX_QUEUE_PORT');
