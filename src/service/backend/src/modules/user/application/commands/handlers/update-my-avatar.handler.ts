import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { UpdateMyAvatarCommand } from '@/modules/user/application/commands/update-my-avatar.command';
import {
	IUserAvatarRepositorySymbol,
	type IUserAvatarRepository,
} from '@/modules/user/domains/repositories/i.user-avatar.repository';
import {
	IUserRepositorySymbol,
	type IUserRepository,
} from '@/modules/user/domains/repositories/i.user.repository';
import { Avatar } from '@/modules/user/domains/entities/avatar.entity';

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
		const avatar = Avatar.create({
			userId: command.userId,
			imageUrl: command.avatarUrl,
		});
		const savedAvatar = await this.userAvatarRepository.upsert(avatar);

		await this.uow.transaction(async () => {
			const user = await this.userRepository.getById(command.userId);
			user.assignAvatarId(savedAvatar.id);
			await this.userRepository.persist(user);
		});

		return {
			avatarId: savedAvatar.id,
			avatarUrl: savedAvatar.imageUrl,
		};
	}
}
