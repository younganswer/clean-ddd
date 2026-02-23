import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/shared/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'users' })
@Unique({ properties: ['email'] })
export class UserSchema extends BaseSchema {
	@Property({ length: 255 })
	displayName!: string;

	@Property({ length: 255 })
	email!: string;

	@Property({ length: 64, nullable: true })
	avatarId: string | null = null;
}
