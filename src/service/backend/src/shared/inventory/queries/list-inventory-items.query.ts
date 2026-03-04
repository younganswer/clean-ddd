import { Query } from '@nestjs/cqrs';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListInventoryItemsQuery extends Query<
	PaginatedView<InventoryItemView>
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
