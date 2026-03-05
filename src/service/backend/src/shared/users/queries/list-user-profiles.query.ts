import { Query } from '@nestjs/cqrs';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListUserProfilesQuery extends Query<
	PaginatedResult<UserProfileResult>
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
