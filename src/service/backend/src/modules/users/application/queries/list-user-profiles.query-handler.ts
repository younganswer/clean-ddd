import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfilesQuery } from '@/modules/users/application/queries/get-user-profiles.query';
import { UserProfileResult } from '@/modules/users/domains/readers/user-profile.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	IUserReaderSymbol,
	type IUserReader,
} from '@/modules/users/domains/readers/i.user.reader';
import {
	IUserAvatarReaderSymbol,
	type IUserAvatarReader,
} from '@/modules/users/domains/readers/i.user-avatar.reader';

@QueryHandler(GetUserProfilesQuery)
export class GetUserProfilesQueryHandler implements IQueryHandler<GetUserProfilesQuery> {
	constructor(
		@Inject(IUserReaderSymbol)
		private readonly userReader: IUserReader,
		@Inject(IUserAvatarReaderSymbol)
		private readonly userAvatarReader: IUserAvatarReader,
	) {}

	async execute(
		query: GetUserProfilesQuery,
	): Promise<PaginatedResult<UserProfileResult>> {
		const [items, total] = await Promise.all([
			this.userReader.findAll(query),
			this.userReader.countAll(),
		]);

		const avatarIds = [...new Set(items.map((item) => item.avatarId ?? ''))]
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		const avatars = await this.userAvatarReader.findByAvatarIds(avatarIds);
		const avatarById = new Map(
			avatars.map((avatar) => [avatar.avatarId, avatar]),
		);

		const enrichedItems = items.map((item) =>
			item.avatarId
				? new UserProfileResult(
						item.userId,
						item.displayName,
						item.email,
						item.avatarId,
						avatarById.get(item.avatarId)?.imageUrl,
					)
				: item,
		);

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
