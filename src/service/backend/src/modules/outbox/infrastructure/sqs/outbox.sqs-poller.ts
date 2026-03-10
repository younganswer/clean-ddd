import {
	Inject,
	Injectable,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import {
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SQSClient,
} from '@aws-sdk/client-sqs';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { resolveOutboxTimeoutPolicy } from '@/modules/outbox/application/outbox-timeout-policy';
import { isOutboxPollingEnabled } from '@/runtime-role';
import { SQS_CLIENT, SQS_OUTBOX_QUEUE_URL } from '@/lib/queue/sqs.module';
import {
	resolveStructuredLogErrorMessage,
	writeStructuredLog,
} from '@/common/logging/structured-log';

@Injectable()
export class OutboxSqsPoller implements OnModuleInit, OnModuleDestroy {
	private static readonly DEFAULT_VISIBILITY_TIMEOUT_SECONDS = 30;
	private stopped = false;
	private inFlight: Promise<void> | null = null;
	private readonly visibilityTimeoutSeconds: number;

	constructor(
		@Inject(SQS_CLIENT) private readonly sqs: SQSClient,
		@Inject(SQS_OUTBOX_QUEUE_URL) private readonly queueUrl: string,
		private readonly consumer: OutboxConsumer,
		private readonly orm: MikroORM,
	) {
		const timeoutPolicy = resolveOutboxTimeoutPolicy({
			lockTimeoutRaw: process.env.OUTBOX_CONSUMER_LOCK_TIMEOUT_MS,
			visibilityTimeoutSecondsRaw:
				process.env.OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS,
			defaultLockTimeoutMs:
				OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS * 1000,
			defaultVisibilityTimeoutSeconds:
				OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS,
			loggerContext: OutboxSqsPoller.name,
		});

		this.visibilityTimeoutSeconds = timeoutPolicy.visibilityTimeoutSeconds;
	}

	onModuleInit() {
		const enabled = isOutboxPollingEnabled();
		if (!enabled) return;

		writeStructuredLog(OutboxSqsPoller.name, {
			step: 'outbox_sqs_polling_enabled',
		});
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
						VisibilityTimeout: this.visibilityTimeoutSeconds,
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
				writeStructuredLog(
					OutboxSqsPoller.name,
					{
						step: 'outbox_sqs_polling_error',
						error: resolveStructuredLogErrorMessage(error),
					},
					'warn',
				);
				await new Promise((r) => setTimeout(r, 1_000));
			}
		}
	}
}
