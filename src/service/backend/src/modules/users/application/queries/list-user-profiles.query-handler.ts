import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfilesQuery } from '@/shared/users/queries/get-user-profiles.query';
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

@QueryHandler(GetUserProfilesQuery)
export class GetUserProfilesQueryHandler implements IQueryHandler<GetUserProfilesQuery> {
	constructor(
		@Inject(IUserRepositorySymbol)
		private readonly userRepository: IUserRepository,
		@Inject(IUserAvatarRepositorySymbol)
		private readonly userAvatarRepository: IUserAvatarRepository,
	) {}

	async execute(
		query: GetUserProfilesQuery,
	): Promise<PaginatedResult<UserProfileResult>> {
		const [items, total] = await Promise.all([
			this.userRepository.findAll(query),
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

		const totalPages = Math.max(1, Math.ceil(total / query.limit));

		return {
			items: enrichedItems,
			offset: query.offset,
			limit: query.limit,
			total,
			totalPages,
			hasNext: query.offset + items.length < total,
		};
	}
}
