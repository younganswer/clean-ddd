import { BaseEntity } from '@/common/domain/base.entity';
import { USER_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';

export class User extends BaseEntity {
	private constructor(
		id: string,
		private readonly _displayName: string,
		private readonly _email: string,
		private _avatarId: string | null,
	) {
		super(id);
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

	assignAvatarId(avatarId: string): void {
		const normalized = String(avatarId ?? '').trim();
		if (!normalized) {
			throw DomainErrorFactory.create(
				USER_DOMAIN_ERRORS.USER_AVATAR_ID_REQUIRED,
			);
		}

		this._avatarId = normalized;
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

	toPrimitives(): {
		userId: string;
		displayName: string;
		email: string;
		avatarId: string | null;
	} {
		return {
			userId: this.id,
			displayName: this._displayName,
			email: this._email,
			avatarId: this._avatarId,
		};
	}
}
