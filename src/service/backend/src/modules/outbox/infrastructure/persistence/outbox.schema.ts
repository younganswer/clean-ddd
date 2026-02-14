import { Entity, Index, Property } from '@mikro-orm/core';
import { OutboxEventStatus } from '@/shared/outbox';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'outbox_events' })
@Index({ properties: ['status', 'nextAttemptAt'] })
export class OutboxEventSchema extends BaseSchema {
  @Property({ type: 'text' })
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

  @Property({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;

  @Property({ type: 'text', nullable: true })
  lastError: string | null = null;
}
