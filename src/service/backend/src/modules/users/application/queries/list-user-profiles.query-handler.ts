import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import {
  IUserProfileRepositorySymbol,
  type IUserProfileRepository,
} from '@/modules/users/domains/repositories/i.user-profile.repository';

@QueryHandler(ListUserProfilesQuery)
export class ListUserProfilesQueryHandler implements IQueryHandler<ListUserProfilesQuery> {
  constructor(
    @Inject(IUserProfileRepositorySymbol)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(
    query: ListUserProfilesQuery,
  ): Promise<PaginatedView<UserProfileView>> {
    const limit = Math.min(
      200,
      Math.max(1, Number(query.input.limit ?? 20) || 20),
    );
    const page = Math.max(1, Number(query.input.page ?? 1) || 1);
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.userProfileRepository.listProfiles({ limit, page }),
      this.userProfileRepository.countProfiles(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      page,
      limit,
      total,
      totalPages,
      hasNext: offset + items.length < total,
    };
  }
}
