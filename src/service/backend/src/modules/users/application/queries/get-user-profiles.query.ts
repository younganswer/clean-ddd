import { Query } from '@nestjs/cqrs';
import type { UserProfileResult } from '@/modules/users/domains/readers/user-profile.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';

export class GetUserProfilesQuery extends Query<
	PaginatedResult<UserProfileResult>
> {
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { limit?: number; offset?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 200,
			fallback: 20,
		});
		this.offset = toBoundedInt(input.offset, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
	}
}
