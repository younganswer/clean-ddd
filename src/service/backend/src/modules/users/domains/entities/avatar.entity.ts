import { BaseEntity } from '@/common/domain/base.entity';
import {
	UserDomainAvatarImageUrlRequiredException,
	UserDomainAvatarUserIdRequiredException,
} from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';
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
			throw DomainExceptionFactory.create(
				UserDomainAvatarUserIdRequiredException,
			);
		}
		if (!imageUrl) {
			throw DomainExceptionFactory.create(
				UserDomainAvatarImageUrlRequiredException,
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
