import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserProfileQuery } from '../../../../shared/users/queries/get-user-profile.query';
import type { UserProfileView } from '../../../../shared/users/readers/user-profile.view';
import {
  IUserProfileRepositorySymbol,
  type IUserProfileRepository,
} from '../../domains/repositories/i.user-profile.repository';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery> {
  constructor(
    @Inject(IUserProfileRepositorySymbol)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserProfileView> {
    return await this.userProfileRepository.getProfileByUserId(query.userId);
  }
}
