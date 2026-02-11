import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { OutboxConsumer } from '../../application/outbox.consumer';
import { SQS_CLIENT, SQS_OUTBOX_QUEUE_URL } from '../../../sqs/sqs.module';

@Injectable()
export class OutboxSqsPoller implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxSqsPoller.name);
  private stopped = false;
  private inFlight: Promise<void> | null = null;

  constructor(
    @Inject(SQS_CLIENT) private readonly sqs: SQSClient,
    @Inject(SQS_OUTBOX_QUEUE_URL) private readonly queueUrl: string,
    private readonly consumer: OutboxConsumer,
    private readonly orm: MikroORM,
  ) {}

  onModuleInit() {
    const enabled = process.env.OUTBOX_POLLING_ENABLED === 'true';
    if (!enabled) return;

    this.logger.log('polling enabled');
    this.inFlight = this.loop();
  }

  async onModuleDestroy() {
    this.stopped = true;
    await this.inFlight?.catch(() => undefined);
  }

  private async loop(): Promise<void> {
    while (!this.stopped) {
      try {
        const res = await this.sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 10,
            VisibilityTimeout: 30,
          }),
        );

        const msg = res.Messages?.[0];
        const body = msg?.Body;
        const receiptHandle = msg?.ReceiptHandle;
        if (!body || !receiptHandle) continue;

        await RequestContext.create(this.orm.em.fork(), async () => {
          await this.consumer.consumeRawMessage({ body });
        });

        await this.sqs.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
          }),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`polling error: ${message}`);
        await new Promise((r) => setTimeout(r, 1_000));
      }
    }
  }
}
