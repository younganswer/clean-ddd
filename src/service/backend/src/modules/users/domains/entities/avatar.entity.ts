import { BaseEntity } from '@/shared/domain/base.entity';

export class Avatar extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _userId: string,
		private readonly _imageUrl: string,
	) {
		super(uuid);
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
