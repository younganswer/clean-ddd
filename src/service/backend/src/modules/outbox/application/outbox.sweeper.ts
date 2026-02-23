import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxQueue } from '@/modules/outbox/infrastructure/queue/outbox.queue';
import { OutboxConsumer } from '@/modules/outbox/application/outbox.consumer';
import {
  createRetryAt,
  resolveErrorMessage,
} from '@/modules/outbox/application/outbox-error.util';

@Injectable()
export class OutboxSweeper {
  private readonly logger = new Logger(OutboxSweeper.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  private isDirectConsumeFallbackEnabled(): boolean {
    return process.env.OUTBOX_DIRECT_CONSUME_FALLBACK === 'true';
  }

  private async consumeDirect(outboxId: string): Promise<void> {
    const consumer = this.moduleRef.get(OutboxConsumer, { strict: false });
    if (!consumer) {
      throw new Error('OutboxConsumer provider not found');
    }

    await consumer.consumeRawMessage({
      body: JSON.stringify({
        schemaVersion: 1,
        outboxId,
      }),
    });
  }

  async sweepAndEnqueue(limit: number): Promise<number> {
    const now = new Date();
    const candidates = await this.outboxRepo.findDispatchable(limit, now);
    let enqueued = 0;
    const directConsumeFallbackEnabled = this.isDirectConsumeFallbackEnabled();

    for (const event of candidates) {
      if (!event.uuid) continue;

      if (directConsumeFallbackEnabled) {
        try {
          await this.consumeDirect(event.uuid);
          enqueued += 1;
          continue;
        } catch (error: unknown) {
          const message = resolveErrorMessage(error);
          this.logger.warn(
            `direct consume failed: outboxId=${event.uuid} err=${message}`,
          );
          await this.outboxRepo.recordFailure(
            event.uuid,
            message,
            createRetryAt(30_000),
          );
          continue;
        }
      }

      try {
        const payload =
          typeof event.payload === 'object' && event.payload !== null
            ? event.payload
            : undefined;
        const orderId = payload?.orderId;
        const messageGroupId =
          typeof orderId === 'string' && orderId ? orderId : 'outbox';

        await this.outboxQueue.enqueue(event.uuid, { messageGroupId });
        await this.outboxRepo.markAsPublished(event.uuid);
        enqueued += 1;
      } catch (error: unknown) {
        const message = resolveErrorMessage(error);
        this.logger.warn(
          `enqueue failed: outboxId=${event.uuid} err=${message}`,
        );
        await this.outboxRepo.recordFailure(
          event.uuid,
          message,
          createRetryAt(30_000),
        );
      }
    }

    return enqueued;
  }
}
