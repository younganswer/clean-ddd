import { BaseDocument } from '@/shared/persistence/no-sql/base.document';

export class AvatarDocument extends BaseDocument {
	constructor(
		input: Omit<AvatarDocument, '_id' | 'createdAt' | 'updatedAt'>,
	) {
		super(input.uuid);
		this.userId = input.userId;
		this.imageUrl = input.imageUrl;
	}

	userId!: string;
	imageUrl!: string;
}
