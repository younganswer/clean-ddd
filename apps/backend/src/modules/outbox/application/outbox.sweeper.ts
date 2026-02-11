import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from 'src/shared/outbox';
import { OutboxQueue } from '../infrastructure/queue/outbox.queue';

@Injectable()
export class OutboxSweeper {
  private readonly logger = new Logger(OutboxSweeper.name);

  constructor(
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  async sweepAndEnqueue(limit: number): Promise<number> {
    const now = new Date();
    const candidates = await this.outboxRepo.findDispatchable(limit, now);
    let enqueued = 0;

    for (const event of candidates) {
      if (!event.uuid) continue;
      try {
        const payload =
          typeof event.payload === 'object' && event.payload !== null
            ? event.payload
            : undefined;
        const orderId = payload?.orderId;
        const messageGroupId =
          typeof orderId === 'string' && orderId ? orderId : 'outbox';

        await this.outboxQueue.enqueue(event.uuid, { messageGroupId });
        enqueued += 1;
      } catch (error: unknown) {
        const maybeError =
          typeof error === 'object' && error !== null
            ? (error as Record<string, unknown>)
            : undefined;
        const message = String(maybeError?.message ?? error);
        this.logger.warn(
          `enqueue failed: outboxId=${event.uuid} err=${message}`,
        );
        await this.outboxRepo.recordFailure(
          event.uuid,
          message,
          new Date(Date.now() + 30_000),
        );
      }
    }

    return enqueued;
  }
}
