import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { OutboxEventDto } from './dto/outbox-event.dto';
import { IOutboxRepository } from './i.outbox.repository';
import { OutboxEventStatus } from './outbox-event-status';
import { OutboxEventSchema } from './outbox.schema';

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async save(event: OutboxEventDto): Promise<string> {
    const em = this.emForContext();
    const row = em.create(OutboxEventSchema, {
      eventType: event.eventType,
      payload: event.payload,
      status: event.status ?? OutboxEventStatus.PENDING,
      attempt: event.attempt ?? 0,
      nextAttemptAt: event.nextAttemptAt ?? new Date(),
      lockedUntil: event.lockedUntil ?? null,
      createdAt: event.createdAt ?? new Date(),
      publishedAt: event.publishedAt ?? null,
      lastError: event.lastError ?? null,
    });
    await em.persistAndFlush(row);
    return row.uuid;
  }

  async findDispatchable(limit: number, now: Date): Promise<OutboxEventDto[]> {
    const em = this.emForContext();
    const rows = await em.find(
      OutboxEventSchema,
      {
        status: OutboxEventStatus.PENDING,
        nextAttemptAt: { $lte: now },
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
      },
      {
        limit,
        orderBy: { createdAt: 'asc' },
      },
    );

    return rows.map((r) => ({
      uuid: r.uuid,
      eventType: r.eventType,
      payload: r.payload,
      status: r.status,
      attempt: r.attempt,
      nextAttemptAt: r.nextAttemptAt,
      lockedUntil: r.lockedUntil,
      createdAt: r.createdAt,
      publishedAt: r.publishedAt,
      lastError: r.lastError,
    }));
  }

  async lock(uuid: string, lockedUntil: Date): Promise<boolean> {
    const em = this.emForContext();
    const now = new Date();
    const updated = await em.nativeUpdate(
      OutboxEventSchema,
      {
        uuid,
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: now } }],
      },
      {
        lockedUntil,
      },
    );
    return updated === 1;
  }

  async unlock(uuid: string): Promise<void> {
    const em = this.emForContext();
    await em.nativeUpdate(
      OutboxEventSchema,
      { uuid },
      { lockedUntil: null },
    );
  }

  async markAsPublished(uuid: string): Promise<void> {
    const em = this.emForContext();
    const row = await em.findOneOrFail(OutboxEventSchema, { uuid });
    row.status = OutboxEventStatus.PUBLISHED;
    row.publishedAt = new Date();
    row.lockedUntil = null;
    await em.persistAndFlush(row);
  }

  async recordFailure(uuid: string, error: string, nextAttemptAt: Date): Promise<void> {
    const em = this.emForContext();
    const row = await em.findOneOrFail(OutboxEventSchema, { uuid });
    row.attempt += 1;
    row.lastError = error;
    row.nextAttemptAt = nextAttemptAt;
    row.lockedUntil = null;
    await em.persistAndFlush(row);
  }
}
