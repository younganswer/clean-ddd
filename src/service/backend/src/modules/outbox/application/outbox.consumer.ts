import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import type { SQSRecord } from 'aws-lambda';
import { IdempotencyService } from '@/shared/idempotency/idempotency.service';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from '@/shared/outbox';
import { OutboxEventSchema } from '@/modules/outbox/infrastructure/persistence/outbox.schema';
import { OutboxEventStatus } from '@/shared/outbox';
import { hydrateEvent } from '@/lib/outbox/event-registry';

@Injectable()
export class OutboxConsumer {
  private readonly logger = new Logger(OutboxConsumer.name);
  private readonly consumerName = 'OutboxConsumer';

  constructor(
    private readonly em: EntityManager,
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly idempotency: IdempotencyService,
    private readonly eventBus: EventBus,
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

    const locked = await this.outboxRepo.lock(
      outboxId,
      new Date(Date.now() + 120_000),
    );
    if (!locked) return;

    try {
      const em = this.emForContext();
      const row = await em.findOne(OutboxEventSchema, { uuid: outboxId });
      if (!row) {
        await this.outboxRepo.unlock(outboxId);
        return;
      }
      if (row.status !== OutboxEventStatus.PENDING) {
        await this.outboxRepo.unlock(outboxId);
        return;
      }

      const claimed = await this.idempotency.claim(this.consumerName, outboxId);
      if (!claimed) {
        await this.outboxRepo.markAsPublished(outboxId);
        return;
      }

      try {
        const event = hydrateEvent(row.eventType, row.payload);
        if (!event) {
          this.logger.warn(`unknown outbox eventType=${row.eventType}`);
          await this.outboxRepo.recordFailure(
            outboxId,
            `unknown eventType=${row.eventType}`,
            new Date(Date.now() + 60_000),
          );
          return;
        }

        this.eventBus.publish(event);
        await this.outboxRepo.markAsPublished(outboxId);
      } catch (error: unknown) {
        const maybeError =
          typeof error === 'object' && error !== null
            ? (error as Record<string, unknown>)
            : undefined;
        const message = String(maybeError?.message ?? error);
        await this.outboxRepo.recordFailure(
          outboxId,
          message,
          new Date(Date.now() + 60_000),
        );
        throw error;
      }
    } catch (error) {
      try {
        await this.outboxRepo.unlock(outboxId);
      } catch {
        // ignore
      }
      throw error;
    }
  }
}
