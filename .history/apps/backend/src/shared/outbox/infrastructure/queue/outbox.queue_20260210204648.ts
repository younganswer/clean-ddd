import { Inject, Injectable } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import {
  SQS_CLIENT,
  SQS_OUTBOX_QUEUE_URL,
} from '../../../../lib/queue/sqs.module';

export interface OutboxDispatchMessage {
  schemaVersion: 1;
  outboxId: string;
}

@Injectable()
export class OutboxQueue {
  constructor(
    @Inject(SQS_CLIENT) private readonly sqs: SQSClient,
    @Inject(SQS_OUTBOX_QUEUE_URL) private readonly queueUrl: string,
  ) {}

  async enqueue(
    outboxId: string,
    options?: { delaySeconds?: number; messageGroupId?: string },
  ): Promise<void> {
    const body: OutboxDispatchMessage = {
      schemaVersion: 1,
      outboxId,
    };

    await this.sqs.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(body),
        DelaySeconds: options?.delaySeconds,
        MessageGroupId: options?.messageGroupId ?? 'outbox',
        MessageDeduplicationId: outboxId,
      }),
    );
  }
}
