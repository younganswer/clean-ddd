import { Index, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

export abstract class BaseSchema {
	[OptionalProps]?: 'id' | 'uuid' | 'createdAt' | 'updatedAt';

	@Property({ type: 'integer', autoincrement: true })
	@Index()
	id?: number;

	@PrimaryKey({ type: 'uuid' })
	uuid: string = randomUUID();

	@Property({ type: 'timestamptz' })
	createdAt: Date = new Date();

	@Property({ type: 'timestamptz' })
	updatedAt: Date = new Date();
}
