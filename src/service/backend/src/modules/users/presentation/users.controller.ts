import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { executeQuery } from '@/common/utils/cqrs-executor';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import type { PaginatedView } from '@/shared/readers/paginated.view';

@Controller('users')
export class UsersController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PaginatedView<UserProfileView>> {
		const limit = Math.min(200, Math.max(1, Number(limitRaw ?? 20) || 20));
		const page = Math.max(1, Number(pageRaw ?? 1) || 1);
		return await executeQuery(
			this.queryBus,
			new ListUserProfilesQuery({ limit, page }),
		);
	}
}
