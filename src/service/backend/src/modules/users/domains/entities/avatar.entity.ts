import { BaseEntity } from '@/shared/domain/base.entity';
import { USER_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';
import { randomUUID } from 'node:crypto';

export class Avatar extends BaseEntity {
	private constructor(
		id: string,
		private readonly _userId: string,
		private readonly _imageUrl: string,
	) {
		super(id);
	}

	static create(input: { userId: string; imageUrl: string }): Avatar {
		const userId = String(input.userId ?? '').trim();
		const imageUrl = String(input.imageUrl ?? '').trim();

		if (!userId) {
			throw DomainErrorFactory.create(
				USER_DOMAIN_ERRORS.AVATAR_USER_ID_REQUIRED,
			);
		}
		if (!imageUrl) {
			throw DomainErrorFactory.create(
				USER_DOMAIN_ERRORS.AVATAR_IMAGE_URL_REQUIRED,
			);
		}

		return new Avatar(randomUUID(), userId, imageUrl);
	}

	static rehydrate(input: {
		uuid: string;
		userId: string;
		imageUrl: string;
	}): Avatar {
		return new Avatar(input.uuid, input.userId, input.imageUrl);
	}

	get userId(): string {
		return this._userId;
	}

	get imageUrl(): string {
		return this._imageUrl;
	}

	toPrimitives(): { avatarId: string; userId: string; imageUrl: string } {
		return {
			avatarId: this.id,
			userId: this._userId,
			imageUrl: this._imageUrl,
		};
	}
}
