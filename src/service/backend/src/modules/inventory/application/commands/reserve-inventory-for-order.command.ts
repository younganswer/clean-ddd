import { Command } from '@nestjs/cqrs';
import type { InventoryOrderItemPayload } from '@/contracts/inventory';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoundedInt,
	toTrimmedString,
} from '@/common/cqrs/input-normalizer';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';

export class ReserveInventoryForOrderCommand extends Command<void> {
	public readonly orderId: string;
	public readonly items: InventoryOrderItemPayload[];

	constructor(input: {
		orderId: string;
		items: InventoryOrderItemPayload[];
	}) {
		super();

		const normalizedItems = Array.isArray(input.items)
			? input.items
					.map((item) => ({
						sku: toTrimmedString(item?.sku),
						quantity: toBoundedInt(item?.quantity, {
							min: 1,
							max: Number.MAX_SAFE_INTEGER,
							fallback: 0,
						}),
					}))
					.filter((item) => item.sku.length > 0 && item.quantity > 0)
			: [];

		if (!normalizedItems.length) {
			throw ApplicationErrorFactory.create(
				INVENTORY_APPLICATION_ERRORS.INVENTORY_EVENT_PAYLOAD_INVALID,
				{ details: { reason: 'items' } },
			);
		}

		this.orderId = requireTrimmedString(
			input.orderId,
			INVENTORY_APPLICATION_ERRORS.INVENTORY_ORDER_ID_REQUIRED,
		);
		this.items = normalizedItems;
	}
}
