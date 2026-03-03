import { Query } from '@nestjs/cqrs';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import type { PaginatedView } from '@/shared/readers/paginated.view';

export class ListUserProfilesQuery extends Query<
	PaginatedView<UserProfileView>
> {
	constructor(
		public readonly input: {
			limit: number;
			page: number;
		},
	) {
		super();
	}
}
