import { Query } from '@nestjs/cqrs';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import type { UserProfileResult } from '@/modules/user/domain/readers/user-profile.result';

export type SystemConceptsBootstrapBffResult = {
	users: PaginatedResult<UserProfileResult>;
	inventoryItems: PaginatedResult<InventoryItemResult>;
};

export class GetSystemConceptsBootstrapBffQuery extends Query<SystemConceptsBootstrapBffResult> {
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { limit?: number; offset?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 200,
			fallback: 50,
		});
		this.offset = toBoundedInt(input.offset, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
	}
}
