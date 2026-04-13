import { Command } from '@nestjs/cqrs';
import {
	UserApplicationUserAvatarUrlRequiredException,
	UserApplicationUserIdRequiredException,
} from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class UpdateMyAvatarCommand extends Command<{
	avatarId: string;
	avatarUrl: string;
}> {
	public readonly userId: string;
	public readonly avatarUrl: string;

	constructor(input: { userId: string; avatarUrl: string }) {
		super();
		const userId = toTrimmedString(input.userId);
		if (!userId) {
			throw ApplicationExceptionFactory.create(
				UserApplicationUserIdRequiredException,
			);
		}

		const avatarUrl = toTrimmedString(input.avatarUrl);
		if (!avatarUrl) {
			throw ApplicationExceptionFactory.create(
				UserApplicationUserAvatarUrlRequiredException,
			);
		}

		this.userId = userId;
		this.avatarUrl = avatarUrl;
	}
}
