import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '@/shared/users/queries/get-user-profile.query';
import { UserProfileResult } from '@/shared/readers/users/user-profile.result';
import {
	IUserReaderSymbol,
	type IUserReader,
} from '@/shared/readers/users/i.user.reader';
import {
	IUserAvatarReaderSymbol,
	type IUserAvatarReader,
} from '@/shared/readers/users/i.user-avatar.reader';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery> {
	constructor(
		@Inject(IUserReaderSymbol)
		private readonly userReader: IUserReader,
		@Inject(IUserAvatarReaderSymbol)
		private readonly userAvatarReader: IUserAvatarReader,
	) {}

	async execute(query: GetUserProfileQuery): Promise<UserProfileResult> {
		const profile = await this.userReader.getById(query.userId);
		if (!profile.avatarId) return profile;

		const avatar = await this.userAvatarReader.findByAvatarId(
			profile.avatarId,
		);
		return new UserProfileResult(
			profile.userId,
			profile.displayName,
			profile.email,
			profile.avatarId,
			avatar?.imageUrl,
		);
	}
}
