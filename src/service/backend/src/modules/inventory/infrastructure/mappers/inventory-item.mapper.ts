import { Injectable } from '@nestjs/common';
import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryItemSchema } from '@/modules/inventory/infrastructure/schemas/inventory-item.schema';

@Injectable()
export class InventoryItemMapper {
	toDomain(schema: InventoryItemSchema): InventoryItem {
		return InventoryItem.rehydrate({
			uuid: schema.uuid,
			sku: schema.sku,
			priceCurrency: schema.priceCurrency,
			priceAmountMinor: schema.priceAmountMinor,
			availableQuantity: schema.availableQuantity,
			reservedQuantity: schema.reservedQuantity,
		});
	}

	toSchema(item: InventoryItem): InventoryItemSchema {
		const primitives = item.toPrimitives();

		return new InventoryItemSchema({
			uuid: primitives.inventoryItemId,
			sku: primitives.sku,
			priceCurrency: primitives.priceCurrency,
			priceAmountMinor: primitives.priceAmountMinor,
			availableQuantity: primitives.availableQuantity,
			reservedQuantity: primitives.reservedQuantity,
		});
	}
}
