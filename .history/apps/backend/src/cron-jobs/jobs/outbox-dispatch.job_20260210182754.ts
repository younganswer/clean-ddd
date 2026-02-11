import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxSweeper } from '../../shared/outbox/application/outbox.sweeper';

@Injectable()
export class OutboxDispatchJob {
  private readonly logger = new Logger(OutboxDispatchJob.name);

  constructor(private readonly sweeper: OutboxSweeper) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async run(): Promise<void> {
    if (process.env.OUTBOX_CRON_ENABLED === 'false') return;

    try {
      const enqueued = await this.sweeper.sweepAndEnqueue(10);
      if (enqueued > 0) {
        this.logger.log(`enqueued=${enqueued}`);
      }
    } catch (error) {
      this.logger.warn(`failed: ${String(error)}`);
    }
  }
}
