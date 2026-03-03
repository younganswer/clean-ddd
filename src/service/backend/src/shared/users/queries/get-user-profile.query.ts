import { Query } from '@nestjs/cqrs';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';

export class GetUserProfileQuery extends Query<UserProfileView> {
	constructor(public readonly userId: string) {
		super();
	}
}
