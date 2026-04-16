import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import {
	UpdateAvatarResponse,
	UserProfileResponse,
} from '@/modules/user/presentation/swagger/user.response';
import { GetUserProfileQuery } from '@/modules/user/application/queries/get-user-profile.query';
import { UpdateMyAvatarCommand } from '@/modules/user/application/commands/update-my-avatar.command';
import { UpdateMyAvatarRequest } from '@/modules/user/presentation/dto/update-my-avatar.request';

@Controller('me')
export class MeController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly authContextAccessor: AuthContextAccessor,
	) {}

	@Get()
	@ApiDataResponse({ model: UserProfileResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async getMyProfile(): Promise<DataEnvelope<UserProfileResponse>> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		const query = new GetUserProfileQuery({ userId });
		const result = await this.queryBus.execute(query);
		const response = UserProfileResponse.fromResult(result);

		return ResponseHelper.data(response);
	}

	@Patch('avatar')
	@ApiDataResponse({ model: UpdateAvatarResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async updateMyAvatar(
		@Body() body: UpdateMyAvatarRequest,
	): Promise<DataEnvelope<UpdateAvatarResponse>> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		const command = new UpdateMyAvatarCommand({
			userId,
			avatarUrl: body.avatarUrl,
		});
		const result = await this.commandBus.execute(command);
		const response = UpdateAvatarResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}
