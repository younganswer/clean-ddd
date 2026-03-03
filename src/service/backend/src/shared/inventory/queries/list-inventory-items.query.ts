import { Query } from '@nestjs/cqrs';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';

export class ListInventoryItemsQuery extends Query<
	PaginatedView<InventoryItemView>
> {
	constructor(
		public readonly limit: number,
		public readonly page: number = 1,
	) {
		super();
	}
}
