import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '@/shared/users/queries/get-user-profile.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import {
  IUserProfileRepositorySymbol,
  type IUserProfileRepository,
} from '@/modules/users/domains/repositories/i.user-profile.repository';
import {
  IUserAvatarRepositorySymbol,
  type IUserAvatarRepository,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery> {
  constructor(
    @Inject(IUserProfileRepositorySymbol)
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject(IUserAvatarRepositorySymbol)
    private readonly userAvatarRepository: IUserAvatarRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileView> {
    const profile = await this.userProfileRepository.getProfileByUserId(
      query.userId,
    );

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
