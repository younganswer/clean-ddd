import { Command } from '@nestjs/cqrs';

export class UpdateMyAvatarCommand extends Command<{
	avatarId: string;
	avatarUrl: string;
}> {
	constructor(
		public readonly userId: string,
		public readonly input: { avatarUrl: string },
	) {
		super();
	}
}
