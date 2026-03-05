import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class GetInventoryItemsQuery extends Query<
	PaginatedResult<InventoryItemResult>
> {
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { limit: number; offset?: number }) {
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
