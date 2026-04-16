import { Query } from '@nestjs/cqrs';
import type { UserProfileResult } from '@/modules/user/domains/readers/user-profile.result';
import { UserApplicationUserIdRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetUserProfileQuery extends Query<UserProfileResult> {
	public readonly userId: string;

	constructor(input: { userId: string }) {
		super();
		const userId = toTrimmedString(input.userId);
		if (!userId) {
			throw ApplicationExceptionFactory.create(
				UserApplicationUserIdRequiredException,
			);
		}

		this.userId = userId;
	}
}
