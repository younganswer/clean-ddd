import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';

export class UserProfileResponse {
	@ApiProperty()
	userId!: string;

	@ApiProperty()
	displayName!: string;

	@ApiProperty()
	email!: string;

	@ApiProperty({ required: false })
	avatarId?: string;

	@ApiProperty({ required: false })
	avatarUrl?: string;

	static fromResult(result: UserProfileResult): UserProfileResponse {
		return {
			userId: result.userId,
			displayName: result.displayName,
			email: result.email,
			avatarId: result.avatarId,
			avatarUrl: result.avatarUrl,
		};
	}

	static fromResults(results: UserProfileResult[]): UserProfileResponse[] {
		return results.map((result) => UserProfileResponse.fromResult(result));
	}

	static fromPaginatedResults(
		page: PaginatedResult<UserProfileResult>,
	): PaginatedResult<UserProfileResponse> {
		return {
			...page,
			items: UserProfileResponse.fromResults(page.items),
		};
	}
}

export class UpdateAvatarResponse {
	@ApiProperty()
	avatarId!: string;

	@ApiProperty()
	avatarUrl!: string;

	static fromResult(result: {
		avatarId: string;
		avatarUrl: string;
	}): UpdateAvatarResponse {
		return {
			avatarId: result.avatarId,
			avatarUrl: result.avatarUrl,
		};
	}
}
