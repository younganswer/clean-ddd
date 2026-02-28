import { Injectable } from '@nestjs/common';
import { Avatar } from '@/modules/users/domains/entities/avatar.entity';
import { AvatarDocument } from '@/modules/users/infrastructure/documents/avatar.document';

@Injectable()
export class AvatarMapper {
	toDomain(document: AvatarDocument): Avatar {
		return Avatar.rehydrate({
			uuid: document.uuid,
			userId: document.userId,
			imageUrl: document.imageUrl,
		});
	}

	toDocument(avatar: Avatar): AvatarDocument {
		const primitives = avatar.toPrimitives();

		return new AvatarDocument({
			uuid: primitives.avatarId,
			userId: primitives.userId,
			imageUrl: primitives.imageUrl,
		});
	}
}
