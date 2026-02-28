import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '@/shared/users/queries/get-user-profile.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import {
	IUserRepositorySymbol,
	type IUserRepository,
} from '@/modules/users/domains/repositories/i.user.repository';
import {
	IUserAvatarRepositorySymbol,
	type IUserAvatarRepository,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery> {
	constructor(
		@Inject(IUserRepositorySymbol)
		private readonly userRepository: IUserRepository,
		@Inject(IUserAvatarRepositorySymbol)
		private readonly userAvatarRepository: IUserAvatarRepository,
	) {}

	async execute(query: GetUserProfileQuery): Promise<UserProfileView> {
		const user = await this.userRepository.findById(query.userId);
		if (!user) {
			throw new Error('user not found');
		}

		const profile: UserProfileView = {
			userId: user.id,
			displayName: user.displayName,
			email: user.email,
			avatarId: user.avatarId ?? undefined,
		};

		if (!profile.avatarId) {
			return { ...profile, avatarUrl: undefined };
		}

		const avatar = await this.userAvatarRepository.findByAvatarId(
			profile.avatarId,
		);
		return {
			...profile,
			avatarUrl: avatar?.imageUrl,
		};
	}
}
