import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger/api-response.decorator';
import { UserProfileResponse } from '@/modules/user/presentation/swagger/user.response';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';
import { GetUserProfilesQuery } from '@/modules/user/application/queries/get-user-profiles.query';

@Controller('user')
export class UserController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: UserProfileResponse as never })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<UserProfileResponse>> {
		const getUserProfilesQuery = new GetUserProfilesQuery({
			limit: query.limit,
			offset: query.offset,
		});
		const result = await this.queryBus.execute(getUserProfilesQuery);
		const response = UserProfileResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}
}
