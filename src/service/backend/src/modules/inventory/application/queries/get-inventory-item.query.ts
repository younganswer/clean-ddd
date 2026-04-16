import { Query } from '@nestjs/cqrs';
import type { InventoryItemResult } from '@/modules/inventory/domain/readers/inventory-item.result';
import { InventoryReservationSkuRequiredException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { toTrimmedString } from '@/common/cqrs/input-normalizer';

export class GetInventoryItemQuery extends Query<InventoryItemResult | null> {
	public readonly sku: string;

	constructor(input: { sku: string }) {
		super();
		const sku = toTrimmedString(input.sku);
		if (!sku) {
			throw ApplicationExceptionFactory.create(
				InventoryReservationSkuRequiredException,
			);
		}

		this.sku = sku;
	}
}
