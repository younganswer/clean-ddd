import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseSchema } from '@/common/persistence/mikro-orm/base.schema';

@Entity({ tableName: 'users' })
@Unique({ properties: ['email'] })
export class UserSchema extends BaseSchema {
	constructor(input: Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'>) {
		super(input.uuid);
		this.displayName = input.displayName;
		this.email = input.email;
		this.avatarId = input.avatarId;
	}

	@Property({ length: 255 })
	displayName!: string;

	@Property({ length: 255 })
	email!: string;

	@Property({ length: 64, nullable: true })
	avatarId: string | null = null;
}
