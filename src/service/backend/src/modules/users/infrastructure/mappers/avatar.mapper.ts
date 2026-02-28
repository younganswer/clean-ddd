import { Injectable } from '@nestjs/common';
import { Avatar } from '@/modules/users/domains/entities/avatar.entity';
import type { UserAvatarDocument } from '@/modules/users/domains/repositories/i.user-avatar.repository';
import type { AvatarDocumentSchema } from '@/modules/users/infrastructure/schemas/avatar.document';

@Injectable()
export class AvatarMapper {
	toDomain(schema: AvatarDocumentSchema): Avatar {
		return Avatar.rehydrate({
			uuid: schema._id,
			userId: schema.userId,
			imageUrl: schema.imageUrl,
		});
	}

	toDocument(schema: AvatarDocumentSchema): UserAvatarDocument {
		const avatar = this.toDomain(schema);
		return {
			avatarId: avatar.uuid,
			userId: avatar.userId,
			imageUrl: avatar.imageUrl,
			createdAt: schema.createdAt,
			updatedAt: schema.updatedAt,
		};
	}
}
