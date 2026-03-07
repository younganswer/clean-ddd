import { Query } from '@nestjs/cqrs';
import type { UserProfileResult } from '@/modules/users/domains/readers/user-profile.result';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetUserProfileQuery extends Query<UserProfileResult> {
	public readonly userId: string;

	constructor(input: { userId: string }) {
		super();
		this.userId = requireTrimmedString(
			input.userId,
			USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
		);
	}
}
