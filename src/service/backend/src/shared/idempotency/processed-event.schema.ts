import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'processed_events' })
@Unique({
	properties: ['consumerName', 'eventId'],
	name: 'uq_processed_consumer_event',
})
@Index({ properties: ['createdAt'] })
export class ProcessedEventSchema extends BaseSchema {
	constructor(
		input: Omit<ProcessedEventSchema, 'id' | 'createdAt' | 'updatedAt'>,
	) {
		super(input.uuid);
		this.consumerName = input.consumerName;
		this.eventId = input.eventId;
	}

	@Property()
	consumerName!: string;

	@Property({ type: 'uuid' })
	eventId!: string;
}
