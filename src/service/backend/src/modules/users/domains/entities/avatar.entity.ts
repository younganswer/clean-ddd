import { BaseEntity } from '@/shared/domain/base.entity';
import { randomUUID } from 'node:crypto';

export class Avatar extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _userId: string,
		private readonly _imageUrl: string,
	) {
		super(uuid);
	}

	static create(input: { userId: string; imageUrl: string }): Avatar {
		const userId = String(input.userId ?? '').trim();
		const imageUrl = String(input.imageUrl ?? '').trim();

		if (!userId) {
			throw new Error('userId is required');
		}
		if (!imageUrl) {
			throw new Error('imageUrl is required');
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
}
