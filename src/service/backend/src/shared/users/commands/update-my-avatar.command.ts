import { Command } from '@nestjs/cqrs';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class UpdateMyAvatarCommand extends Command<{
	avatarId: string;
	avatarUrl: string;
}> {
	public readonly userId: string;
	public readonly avatarUrl: string;

	constructor(input: { userId: string; avatarUrl: string }) {
		super();
		this.userId = requireTrimmedString(
			input.userId,
			USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
		);
		this.avatarUrl = requireTrimmedString(
			input.avatarUrl,
			USER_APPLICATION_ERRORS.USER_AVATAR_URL_REQUIRED,
		);
	}
}
