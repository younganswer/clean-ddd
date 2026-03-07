import { Inject, Injectable } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { SQS_CLIENT, SQS_OUTBOX_QUEUE_URL } from '@/lib/queue/sqs.module';
import { IOutboxQueue } from '@/shared/outbox';

export interface OutboxDispatchMessage {
	schemaVersion: 1;
	outboxId: string;
}

@Injectable()
export class OutboxQueue implements IOutboxQueue {
	constructor(
		@Inject(SQS_CLIENT) private readonly sqs: SQSClient,
		@Inject(SQS_OUTBOX_QUEUE_URL) private readonly queueUrl: string,
	) {}

	private isFifoQueue(): boolean {
		const lowerQueueUrl = this.queueUrl.toLowerCase();
		return lowerQueueUrl.includes('.fifo');
	}

	async enqueue(
		outboxId: string,
		options?: { delaySeconds?: number; messageGroupId?: string },
	): Promise<void> {
		const body: OutboxDispatchMessage = {
			schemaVersion: 1,
			outboxId,
		};

		const isFifoQueue = this.isFifoQueue();
		const messageAttributes = {
			QueueUrl: this.queueUrl,
			MessageBody: JSON.stringify(body),
			...(isFifoQueue
				? {
						MessageGroupId: options?.messageGroupId ?? 'outbox',
						MessageDeduplicationId: outboxId,
					}
				: {
						...(typeof options?.delaySeconds === 'number'
							? { DelaySeconds: options.delaySeconds }
							: {}),
					}),
		};

		await this.sqs.send(new SendMessageCommand(messageAttributes));
	}
}
