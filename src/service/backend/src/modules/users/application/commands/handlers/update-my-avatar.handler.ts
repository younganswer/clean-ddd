import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UpdateMyAvatarCommand } from '@/shared/users/commands/update-my-avatar.command';
import {
	IUserAvatarRepositorySymbol,
	type IUserAvatarRepository,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';
import {
	IUserAvatarLinkRepositorySymbol,
	type IUserAvatarLinkRepository,
} from '@/modules/users/domains/repositories/i.user-avatar-link.repository';

@CommandHandler(UpdateMyAvatarCommand)
export class UpdateMyAvatarHandler implements ICommandHandler<UpdateMyAvatarCommand> {
	constructor(
		@Inject(IUserAvatarRepositorySymbol)
		private readonly userAvatarRepository: IUserAvatarRepository,
		@Inject(IUserAvatarLinkRepositorySymbol)
		private readonly userAvatarLinkRepository: IUserAvatarLinkRepository,
	) {}

	async execute(
		command: UpdateMyAvatarCommand,
	): Promise<{ avatarId: string; avatarUrl: string }> {
		const userId = command.userId.trim();
		const avatarUrl = command.input.avatarUrl.trim();

		if (!userId) {
			throw new Error('userId is required');
		}
		if (!avatarUrl) {
			throw new Error('avatarUrl is required');
		}

		const avatarId = randomUUID();
		const savedAvatar = await this.userAvatarRepository.upsert({
			avatarId,
			userId,
			imageUrl: avatarUrl,
		});

		await this.userAvatarLinkRepository.assignAvatarId({
			userId,
			avatarId: savedAvatar.avatarId,
		});

		return {
			avatarId: savedAvatar.avatarId,
			avatarUrl: savedAvatar.imageUrl,
		};
	}
}
