import { BaseEntity } from '@/shared/domain/base.entity';

export class User extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _displayName: string,
		private readonly _email: string,
		private readonly _avatarId: string | null,
	) {
		super(uuid);
	}

	static rehydrate(input: {
		uuid: string;
		displayName: string;
		email: string;
		avatarId: string | null;
	}): User {
		return new User(
			input.uuid,
			input.displayName,
			input.email,
			input.avatarId,
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
}
