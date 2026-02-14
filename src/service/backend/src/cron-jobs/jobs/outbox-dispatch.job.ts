import { MikroORM } from '@mikro-orm/core';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MikroOrmCronJobAbstract } from 'src/common/abstracts/mikro-orm-cron-job.abstract';
import { executeCommand, executeQuery } from 'src/common/utils/cqrs-executor';
import { DispatchOutboxEventCommand } from 'src/shared/outbox/commands/dispatch-outbox-event.command';
import {
  GetPendingOutboxEventsQuery,
  type GetPendingOutboxEventsResult,
} from 'src/shared/outbox/queries/get-pending-outbox-events.query';

@Injectable()
export class OutboxDispatchJob extends MikroOrmCronJobAbstract {
  private readonly logger = new Logger(OutboxDispatchJob.name);

  constructor(
    orm: MikroORM,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {
    super(orm);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async run(): Promise<void> {
    if (process.env.OUTBOX_CRON_ENABLED === 'false') return;

    try {
      await this.runWithRequestContext();
    } catch (error) {
      this.logger.warn(`failed: ${String(error)}`);
    }
  }

  protected async handleJobWithContext(): Promise<void> {
    const result = await executeQuery<GetPendingOutboxEventsResult>(
      this.queryBus,
      new GetPendingOutboxEventsQuery(10, new Date()),
    );

    const getOrderId = (
      payload: Record<string, unknown>,
    ): string | undefined => {
      const value = payload['orderId'];
      return typeof value === 'string' && value.trim()
        ? value.trim()
        : undefined;
    };

    let dispatched = 0;
    for (const event of result.events) {
      if (!event.uuid) continue;

      const messageGroupId = getOrderId(event.payload) ?? 'outbox';
      await executeCommand(
        this.commandBus,
        new DispatchOutboxEventCommand(event.uuid, messageGroupId),
      );
      dispatched += 1;
    }

    if (dispatched > 0) {
      this.logger.log(`dispatched=${dispatched}`);
    }
  }
}
