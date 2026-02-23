import { BaseEntity } from '@/shared/domain/base.entity';

export class Avatar extends BaseEntity {
	private constructor(
		id: number,
		uuid: string,
		private readonly _userId: string,
		private readonly _imageUrl: string,
		private readonly _createdAt: Date,
		private readonly _updatedAt: Date,
	) {
		super(id, uuid);
	}

	static rehydrate(input: {
		id: number;
		uuid: string;
		userId: string;
		imageUrl: string;
		createdAt: Date;
		updatedAt: Date;
	}): Avatar {
		return new Avatar(
			input.id,
			input.uuid,
			input.userId,
			input.imageUrl,
			input.createdAt,
			input.updatedAt,
		);
	}

	get userId(): string {
		return this._userId;
	}

	get imageUrl(): string {
		return this._imageUrl;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}
}
