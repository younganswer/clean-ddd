import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import { Avatar } from '@/modules/users/domains/entities/avatar.entity';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

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
			throw ApplicationErrorFactory.create(
				USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
			);
		}
		if (!avatarUrl) {
			throw ApplicationErrorFactory.create(
				USER_APPLICATION_ERRORS.USER_AVATAR_URL_REQUIRED,
			);
		}

		const avatar = Avatar.create({
			userId,
			imageUrl: avatarUrl,
		});
		const savedAvatar = await this.userAvatarRepository.upsert(avatar);

		await this.uow.transaction(async () => {
			const user = await this.userRepository.findById(userId);
			if (!user) {
				throw ApplicationErrorFactory.create(
					USER_APPLICATION_ERRORS.USER_NOT_FOUND,
					{
						details: { userId },
					},
				);
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
