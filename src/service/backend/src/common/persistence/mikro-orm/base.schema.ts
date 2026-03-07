import { Index, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';

export abstract class BaseSchema {
	[OptionalProps]?: 'id' | 'uuid' | 'createdAt' | 'updatedAt';

	constructor(uuid: string) {
		this.uuid = uuid;
	}

	@Property({ type: 'integer', autoincrement: true })
	@Index()
	id?: number;

	@PrimaryKey({ type: 'uuid' })
	uuid!: string;

	@Property({ type: 'timestamptz', onCreate: () => new Date() })
	createdAt!: Date;

	@Property({
		type: 'timestamptz',
		onCreate: () => new Date(),
		onUpdate: () => new Date(),
	})
	updatedAt!: Date;
}
