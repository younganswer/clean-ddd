import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PageResponse } from '@/common/responses';
import { ApiErrorEnvelopeResponse, ApiPageResponse } from '@/common/swagger';
import { UserProfileResponseDto } from '@/modules/users/presentation/swagger';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@Controller('users')
export class UsersController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: UserProfileResponseDto as never })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<UserProfileResult>> {
		const result = await this.queryBus.execute<
			ListUserProfilesQuery,
			PaginatedResult<UserProfileResult>
		>(
			new ListUserProfilesQuery({
				limit: Number(limitRaw),
				page: Number(pageRaw),
			}),
		);
		return PageResponse.from(result);
	}
}
