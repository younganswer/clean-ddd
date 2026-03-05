import { Command } from '@nestjs/cqrs';
import type { InventoryOrderItemDto } from '@/shared/inventory/dto/inventory-order-item.dto';
import { INVENTORY_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoundedInt,
	toTrimmedString,
} from '@/shared/cqrs/input-normalizer';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

export class ReserveInventoryForOrderCommand extends Command<void> {
	public readonly orderId: string;
	public readonly items: InventoryOrderItemDto[];

	constructor(input: { orderId: string; items: InventoryOrderItemDto[] }) {
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
