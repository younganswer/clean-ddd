import { Query } from '@nestjs/cqrs';
import type { InventoryItemView } from '@/shared/readers/inventory/dto/inventory-item.view';
import { INVENTORY_DOMAIN_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/shared/cqrs/input-normalizer';

export class GetInventoryItemQuery extends Query<InventoryItemView | null> {
	public readonly sku: string;

	constructor(sku: string) {
		super();
		this.sku = requireTrimmedString(
			sku,
			INVENTORY_DOMAIN_ERRORS.INVENTORY_RESERVATION_SKU_REQUIRED,
		);
	}
}
