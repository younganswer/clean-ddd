import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isOutboxCronEnabled } from '@/runtime-role';
import { OutboxDispatcher } from '@/modules/outbox/application/outbox.dispatcher';

@Injectable()
export class OutboxDispatchJob {
  private readonly logger = new Logger(OutboxDispatchJob.name);

  constructor(private readonly outboxDispatcher: OutboxDispatcher) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async run(): Promise<void> {
    if (!isOutboxCronEnabled()) return;

    try {
      await this.outboxDispatcher.dispatchPending(10, new Date());
    } catch (error) {
      this.logger.warn(`failed: ${String(error)}`);
    }
  }
}
