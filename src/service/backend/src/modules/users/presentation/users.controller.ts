import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PageEnvelope, ResponseHelper } from '@/common/responses';
import { ApiErrorEnvelopeResponse, ApiPageResponse } from '@/common/swagger';
import { UserProfileResponse } from '@/modules/users/presentation/swagger';
import { PageQueryDto } from '@/shared/cqrs/query-input.dto';
import { GetUserProfilesQuery } from '@/shared/users/queries/get-user-profiles.query';

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
				limit: query.limit ?? Number.NaN,
				offset: query.offset ?? Number.NaN,
			}),
		);
		return ResponseHelper.page({
			...result,
			items: UserProfileResponse.fromResults(result.items),
		});
	}
}
