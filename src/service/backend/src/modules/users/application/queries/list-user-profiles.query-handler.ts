import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import {
	IUserRepositorySymbol,
	type IUserRepository,
} from '@/modules/users/domains/repositories/i.user.repository';
import {
	IUserAvatarRepositorySymbol,
	type IUserAvatarRepository,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';

@QueryHandler(ListUserProfilesQuery)
export class ListUserProfilesQueryHandler implements IQueryHandler<ListUserProfilesQuery> {
	constructor(
		@Inject(IUserRepositorySymbol)
		private readonly userRepository: IUserRepository,
		@Inject(IUserAvatarRepositorySymbol)
		private readonly userAvatarRepository: IUserAvatarRepository,
	) {}

	async execute(
		query: ListUserProfilesQuery,
	): Promise<PaginatedResult<UserProfileResult>> {
		const { limit, page } = query.input;
		const offset = (page - 1) * limit;

		const [items, total] = await Promise.all([
			this.userRepository.findAll({ limit, page }),
			this.userRepository.countAll(),
		]);

		const profiles: UserProfileResult[] = items.map((user) => ({
			userId: user.id,
			displayName: user.displayName,
			email: user.email,
			avatarId: user.avatarId ?? undefined,
		}));

		const avatarIds = [
			...new Set(profiles.map((item) => item.avatarId ?? '')),
		]
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		const avatars =
			await this.userAvatarRepository.findByAvatarIds(avatarIds);
		const avatarById = new Map(
			avatars.map((avatar) => [avatar.id, avatar]),
		);

		const enrichedItems = profiles.map((item) => ({
			...item,
			avatarUrl: item.avatarId
				? avatarById.get(item.avatarId)?.imageUrl
				: undefined,
		}));

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items: enrichedItems,
			page,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
