import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { SQSRecord } from 'aws-lambda';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { IOutboxRepositorySymbol } from './i.outbox.repository';
import type { IOutboxRepository } from './i.outbox.repository';
import { OutboxRouter } from './outbox.router';
import { OutboxEventSchema } from './outbox.schema';
import { OutboxEventStatus } from './outbox-event-status';

@Injectable()
export class OutboxConsumer {
  private readonly logger = new Logger(OutboxConsumer.name);
  private readonly consumerName = 'OutboxConsumer';

  constructor(
    private readonly em: EntityManager,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly idempotency: IdempotencyService,
    private readonly router: OutboxRouter,
  ) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async consumeRawMessage(record: Pick<SQSRecord, 'body'>): Promise<void> {
    let outboxId: string | undefined;
    try {
      const parsed = JSON.parse(record.body) as { outboxId?: string };
      outboxId = parsed.outboxId;
    } catch {
      this.logger.warn('invalid message body (not json)');
      return;
    }

    if (!outboxId) {
      this.logger.warn('invalid message body (missing outboxId)');
      return;
    }

    const locked = await this.outboxRepo.lock(outboxId, new Date(Date.now() + 120_000));
    if (!locked) return;

    const em = this.emForContext();
    const row = await em.findOne(OutboxEventSchema, { uuid: outboxId });
    if (!row) return;
    if (row.status !== OutboxEventStatus.PENDING) return;

    const claimed = await this.idempotency.claim(this.consumerName, outboxId);
    if (!claimed) {
      await this.outboxRepo.markAsPublished(outboxId);
      return;
    }

    try {
      await this.router.route({
        outboxId,
        eventType: row.eventType,
        payload: row.payload,
      });
      await this.outboxRepo.markAsPublished(outboxId);
    } catch (error: any) {
      await this.outboxRepo.recordFailure(outboxId, String(error?.message ?? error), new Date(Date.now() + 60_000));
      throw error;
    }
  }
}
