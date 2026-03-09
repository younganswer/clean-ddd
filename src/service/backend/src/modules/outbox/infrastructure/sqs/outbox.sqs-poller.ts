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
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import { isOutboxPollingEnabled } from '@/runtime-role';
import { SQS_CLIENT, SQS_OUTBOX_QUEUE_URL } from '@/lib/queue/sqs.module';

@Injectable()
export class OutboxSqsPoller implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(OutboxSqsPoller.name);
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
		this.visibilityTimeoutSeconds = this.resolveVisibilityTimeoutSeconds();
	}

	private resolveVisibilityTimeoutSeconds(): number {
		const explicit = process.env.OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS;
		if (explicit) {
			const parsed = Number(explicit);
			if (Number.isFinite(parsed) && parsed > 0) {
				return Math.floor(parsed);
			}
			this.logger.warn(
				`invalid OUTBOX_SQS_VISIBILITY_TIMEOUT_SECONDS=${explicit}; using default ${OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS}`,
			);
			return OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS;
		}

		const lockTimeoutRaw = process.env.OUTBOX_CONSUMER_LOCK_TIMEOUT_MS;
		if (!lockTimeoutRaw) {
			return OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS;
		}

		const lockTimeoutMs = Number(lockTimeoutRaw);
		if (!Number.isFinite(lockTimeoutMs) || lockTimeoutMs <= 0) {
			this.logger.warn(
				`invalid OUTBOX_CONSUMER_LOCK_TIMEOUT_MS=${lockTimeoutRaw}; using default ${OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS}`,
			);
			return OutboxSqsPoller.DEFAULT_VISIBILITY_TIMEOUT_SECONDS;
		}

		return Math.max(1, Math.floor(lockTimeoutMs / 1000));
	}

	onModuleInit() {
		const enabled = isOutboxPollingEnabled();
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
				const message =
					error instanceof Error ? error.message : String(error);
				this.logger.warn(`polling error: ${message}`);
				await new Promise((r) => setTimeout(r, 1_000));
			}
		}
	}
}
