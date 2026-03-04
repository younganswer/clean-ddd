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
		const userId = command.userId;
		const avatarUrl = command.input.avatarUrl;

		const avatar = Avatar.create({
			userId,
			imageUrl: avatarUrl,
		});
		const savedAvatar = await this.userAvatarRepository.upsert(avatar);

		await this.uow.transaction(async () => {
			const user = await this.userRepository.getById(userId, {
				failHandler: () => {
					const template = USER_APPLICATION_ERRORS.USER_NOT_FOUND;
					const options = { details: { userId } };
					return ApplicationErrorFactory.create(template, options);
				},
			});
			user.assignAvatarId(savedAvatar.id);
			await this.userRepository.persist(user);
		});

		return {
			avatarId: savedAvatar.id,
			avatarUrl: savedAvatar.imageUrl,
		};
	}
}
