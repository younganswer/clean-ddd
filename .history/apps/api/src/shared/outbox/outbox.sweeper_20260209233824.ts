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
      const locked = await this.outboxRepo.lock(event.uuid, new Date(Date.now() + 60_000));
      if (!locked) continue;
      try {
        await this.outboxQueue.enqueue(event.uuid);
        enqueued += 1;
      } catch (error: any) {
        this.logger.warn(`enqueue failed: outboxId=${event.uuid} err=${String(error?.message ?? error)}`);
        await this.outboxRepo.recordFailure(event.uuid, String(error?.message ?? error), new Date(Date.now() + 30_000));
      }
    }

    return enqueued;
  }
}
