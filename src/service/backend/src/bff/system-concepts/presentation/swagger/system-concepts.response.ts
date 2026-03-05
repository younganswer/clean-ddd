import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';
import { InventoryItemResponse } from '@/modules/inventory/presentation/swagger';
import { UserProfileResponse } from '@/modules/users/presentation/swagger';

export class PaginatedUserProfileResponse {
	@ApiProperty({ type: [UserProfileResponse] })
	items!: UserProfileResponse[];

	@ApiProperty()
	offset!: number;

	@ApiProperty()
	limit!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	totalPages!: number;

	@ApiProperty()
	hasNext!: boolean;

	static fromPage(
		result: PaginatedResult<UserProfileResult>,
	): PaginatedUserProfileResponse {
		return {
			items: UserProfileResponse.fromResults(result.items),
			offset: result.offset,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
			hasNext: result.hasNext,
		};
	}
}

export class PaginatedInventoryItemResponse {
	@ApiProperty({ type: [InventoryItemResponse] })
	items!: InventoryItemResponse[];

	@ApiProperty()
	offset!: number;

	@ApiProperty()
	limit!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	totalPages!: number;

	@ApiProperty()
	hasNext!: boolean;

	static fromPage(
		result: PaginatedResult<InventoryItemResult>,
	): PaginatedInventoryItemResponse {
		return {
			items: InventoryItemResponse.fromResults(result.items),
			offset: result.offset,
			limit: result.limit,
			total: result.total,
			totalPages: result.totalPages,
			hasNext: result.hasNext,
		};
	}
}

export class SystemConceptsBootstrapResponse {
	@ApiProperty({ type: PaginatedUserProfileResponse })
	users!: PaginatedUserProfileResponse;

	@ApiProperty({ type: PaginatedInventoryItemResponse })
	inventoryItems!: PaginatedInventoryItemResponse;

	static fromResult(result: {
		users: PaginatedResult<UserProfileResult>;
		inventoryItems: PaginatedResult<InventoryItemResult>;
	}): SystemConceptsBootstrapResponse {
		return {
			users: PaginatedUserProfileResponse.fromPage(result.users),
			inventoryItems: PaginatedInventoryItemResponse.fromPage(
				result.inventoryItems,
			),
		};
	}
}
