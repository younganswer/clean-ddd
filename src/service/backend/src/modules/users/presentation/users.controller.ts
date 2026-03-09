import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PageEnvelope, ResponseHelper } from '@/common/responses';
import { ApiErrorEnvelopeResponse, ApiPageResponse } from '@/common/swagger';
import { UserProfileResponse } from '@/modules/users/presentation/swagger';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';
import { GetUserProfilesQuery } from '@/modules/users/application/queries/get-user-profiles.query';

@Controller('users')
export class UsersController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: UserProfileResponse as never })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<UserProfileResponse>> {
		const result = await this.queryBus.execute(
			new GetUserProfilesQuery({
				limit: query.limit,
				offset: query.offset,
			}),
		);
		const response = UserProfileResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}
}
