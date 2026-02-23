import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthContextAccessor } from '@/common/context/auth-context';
import { executeCommand, executeQuery } from '@/common/utils/cqrs-executor';
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
	async getMyProfile(): Promise<UserProfileView> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		return await executeQuery(
			this.queryBus,
			new GetUserProfileQuery(userId),
		);
	}

	@Patch('avatar')
	async updateMyAvatar(
		@Body() body: UpdateMyAvatarRequest,
	): Promise<{ avatarId: string; avatarUrl: string }> {
		const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
		return await executeCommand(
			this.commandBus,
			new UpdateMyAvatarCommand(userId, { avatarUrl: body.avatarUrl }),
		);
	}
}
