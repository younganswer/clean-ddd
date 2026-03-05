import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { InventoryItemResult } from '@/shared/readers/inventory/dto/inventory-item.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListInventoryItemsQuery extends Query<
	PaginatedResult<InventoryItemResult>
> {
	public readonly limit: number;

	public readonly page: number;

	constructor(limit: number, page: number = 1) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 1,
			max: 200,
			fallback: 50,
		});
		this.page = toBoundedInt(page, {
			min: 1,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 1,
		});
	}
}
