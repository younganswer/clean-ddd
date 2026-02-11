import { Injectable, Logger } from '@nestjs/common';
import { OutboxRepository } from './outbox.repository';
import { OutboxQueue } from './outbox.queue';

@Injectable()
export class OutboxSweeper {
  private readonly logger = new Logger(OutboxSweeper.name);

  constructor(
    private readonly outboxRepo: OutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  async sweepAndEnqueue(limit: number): Promise<number> {
    const now = new Date();
    const candidates = await this.outboxRepo.findDispatchable(limit, now);
    let enqueued = 0;

    for (const event of candidates) {
      if (!event.uuid) continue;
      try {
        const messageGroupId =
          typeof (event.payload as any)?.orderId === 'string' && (event.payload as any).orderId
            ? String((event.payload as any).orderId)
            : 'outbox';

        await this.outboxQueue.enqueue(event.uuid, { messageGroupId });
        enqueued += 1;
      } catch (error: any) {
        this.logger.warn(`enqueue failed: outboxId=${event.uuid} err=${String(error?.message ?? error)}`);
        await this.outboxRepo.recordFailure(event.uuid, String(error?.message ?? error), new Date(Date.now() + 30_000));
      }
    }

    return enqueued;
  }
}
