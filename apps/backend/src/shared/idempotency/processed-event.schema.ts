import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'processed_events' })
@Unique({
  properties: ['consumerName', 'eventId'],
  name: 'uq_processed_consumer_event',
})
@Index({ properties: ['processedAt'] })
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
