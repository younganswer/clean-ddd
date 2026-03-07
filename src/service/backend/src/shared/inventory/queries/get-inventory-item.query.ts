import { Query } from '@nestjs/cqrs';
import type { InventoryItemResult } from '@/shared/inventory/readers/dto/inventory-item.result';
import { INVENTORY_DOMAIN_ERRORS } from '@/shared/errors';
import { requireTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetInventoryItemQuery extends Query<InventoryItemResult | null> {
	public readonly sku: string;

	constructor(input: { sku: string }) {
		super();
		this.sku = requireTrimmedString(
			input.sku,
			INVENTORY_DOMAIN_ERRORS.INVENTORY_RESERVATION_SKU_REQUIRED,
		);
	}
}
