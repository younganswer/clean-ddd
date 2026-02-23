import { BaseEntity } from '@/shared/domain/base.entity';

export class User extends BaseEntity {
	private constructor(
		id: number,
		uuid: string,
		private readonly _displayName: string,
		private readonly _email: string,
		private readonly _avatarId: string | null,
		private readonly _createdAt: Date,
		private readonly _updatedAt: Date,
	) {
		super(id, uuid);
	}

	static rehydrate(input: {
		id: number;
		uuid: string;
		displayName: string;
		email: string;
		avatarId: string | null;
		createdAt: Date;
		updatedAt: Date;
	}): User {
		return new User(
			input.id,
			input.uuid,
			input.displayName,
			input.email,
			input.avatarId,
			input.createdAt,
			input.updatedAt,
		);
	}

	get displayName(): string {
		return this._displayName;
	}

	get email(): string {
		return this._email;
	}

	get avatarId(): string | null {
		return this._avatarId;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}
}
