import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { IUserAvatarLinkRepository } from '@/modules/users/domains/repositories/i.user-avatar-link.repository';
import { UserSchema } from '@/modules/users/infrastructure/schemas/user.schema';

@Injectable()
export class SqlUserAvatarLinkRepository implements IUserAvatarLinkRepository {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async assignAvatarId(input: {
		userId: string;
		avatarId: string;
	}): Promise<void> {
		const userId = input.userId.trim();
		const avatarId = input.avatarId.trim();
		if (!userId || !avatarId) {
			throw new Error('userId and avatarId are required');
		}

		const em = this.emForContext();
		const user = await em.findOneOrFail(UserSchema, { uuid: userId });
		user.avatarId = avatarId;
		user.updatedAt = new Date();
		await em.persistAndFlush(user);
	}
}
