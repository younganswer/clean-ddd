import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { executeCommand, executeQuery } from '@/common/utils/cqrs-executor';
import {
	UserProfileResponseDto,
	UpdateAvatarResultResponseDto,
} from '@/modules/users/presentation/swagger';
import { GetUserProfileQuery } from '@/shared/users/queries/get-user-profile.query';
import { UpdateMyAvatarCommand } from '@/shared/users/commands/update-my-avatar.command';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import { UpdateMyAvatarRequest } from '@/modules/users/presentation/dto/update-my-avatar.request';

@Controller('me')
export class MeController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly authContextAccessor: AuthContextAccessor,
	) {}

	@Get()
	@ApiDataResponse({ model: UserProfileResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async getMyProfile(): Promise<DataResponse<UserProfileView>> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		const result = await executeQuery<UserProfileView>(
			this.queryBus,
			new GetUserProfileQuery(userId),
		);
		return DataResponse.of(result);
	}

	@Patch('avatar')
	@ApiDataResponse({ model: UpdateAvatarResultResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async updateMyAvatar(
		@Body() body: UpdateMyAvatarRequest,
	): Promise<DataResponse<{ avatarId: string; avatarUrl: string }>> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		const result = await executeCommand<{
			avatarId: string;
			avatarUrl: string;
		}>(
			this.commandBus,
			new UpdateMyAvatarCommand(userId, { avatarUrl: body.avatarUrl }),
		);
		return DataResponse.of(result);
	}
}
