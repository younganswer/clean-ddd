import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'processed_events' })
@Index({ properties: ['consumerName', 'eventId'], name: 'uq_processed_consumer_event', unique: true })
export class ProcessedEventSchema {
  @PrimaryKey({ type: 'uuid' })
  uuid: string = randomUUID();

  @Property()
  consumerName!: string;

  @Property({ type: 'uuid' })
  eventId!: string;

  @Property({ type: 'timestamptz' })
  processedAt: Date = new Date();
}
