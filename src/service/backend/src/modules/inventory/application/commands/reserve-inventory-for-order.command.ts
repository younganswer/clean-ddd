import { Command } from '@nestjs/cqrs';
import type { InventoryOrderItemPayload } from '@/contracts/inventory/events/reserve-inventory-for-order-requested.event';
import {
	InventoryEventPayloadInvalidException,
	InventoryOrderIdRequiredException,
} from '@/shared/exceptions';
import { toBoundedInt, toTrimmedString } from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

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
			throw ApplicationExceptionFactory.create(
				InventoryEventPayloadInvalidException,
				{ cause: { description: 'items' } },
			);
		}

		const orderId = toTrimmedString(input.orderId);
		if (!orderId) {
			throw ApplicationExceptionFactory.create(
				InventoryOrderIdRequiredException,
			);
		}

		this.orderId = orderId;
		this.items = normalizedItems;
	}
}
