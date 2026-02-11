import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { OutboxEventStatus } from '../../../../shared/outbox';

@Entity({ tableName: 'outbox_events' })
@Index({ properties: ['status', 'nextAttemptAt'] })
export class OutboxEventSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property()
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ type: 'string' })
  status: OutboxEventStatus = OutboxEventStatus.PENDING;

  @Property({ type: 'int' })
  attempt: number = 0;

  @Property({ type: 'timestamptz' })
  nextAttemptAt: Date = new Date();

  @Property({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null = null;

  @Property({ type: 'timestamptz' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;

  @Property({ type: 'text', nullable: true })
  lastError: string | null = null;
}
