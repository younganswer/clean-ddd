import { Query } from '@nestjs/cqrs';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetUserProfileQuery extends Query<UserProfileView> {
	public readonly userId: string;

	constructor(userId: string) {
		super();
		this.userId = requireTrimmedString(
			userId,
			USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
		);
	}
}
