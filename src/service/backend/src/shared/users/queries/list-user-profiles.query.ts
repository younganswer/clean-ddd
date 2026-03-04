import { Query } from '@nestjs/cqrs';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListUserProfilesQuery extends Query<
	PaginatedView<UserProfileView>
> {
	public readonly input: {
		limit: number;
		page: number;
	};

	constructor(input: { limit: number; page: number }) {
		super();
		this.input = {
			limit: toBoundedInt(input.limit, {
				min: 1,
				max: 200,
				fallback: 20,
			}),
			page: toBoundedInt(input.page, {
				min: 1,
				max: Number.MAX_SAFE_INTEGER,
				fallback: 1,
			}),
		};
	}
}
