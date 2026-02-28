import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { UpdateMyAvatarCommand } from '@/shared/users/commands/update-my-avatar.command';
import {
	IUserAvatarRepositorySymbol,
	type IUserAvatarRepository,
} from '@/modules/users/domains/repositories/i.user-avatar.repository';
import {
	IUserRepositorySymbol,
	type IUserRepository,
} from '@/modules/users/domains/repositories/i.user.repository';

@CommandHandler(UpdateMyAvatarCommand)
export class UpdateMyAvatarHandler implements ICommandHandler<UpdateMyAvatarCommand> {
	constructor(
		@Inject(IUserAvatarRepositorySymbol)
		private readonly userAvatarRepository: IUserAvatarRepository,
		@Inject(IUserRepositorySymbol)
		private readonly userRepository: IUserRepository,
		private readonly uow: UnitOfWork,
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

		await this.uow.transaction(async () => {
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw new Error('user not found');
			}

			user.assignAvatarId(savedAvatar.id);
			await this.userRepository.persist(user);
		});

		return {
			avatarId: savedAvatar.id,
			avatarUrl: savedAvatar.imageUrl,
		};
	}
}
