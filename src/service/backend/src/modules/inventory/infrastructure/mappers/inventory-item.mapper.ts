import { Injectable } from '@nestjs/common';
import { InventoryItem } from '../../domains/entities/inventory-item.entity';
import { InventoryItemSchema } from '../schemas/inventory-item.schema';

@Injectable()
export class InventoryItemMapper {
  toDomain(schema: InventoryItemSchema): InventoryItem {
    return InventoryItem.rehydrate({
      id: schema.uuid,
      sku: schema.sku,
      priceCurrency: schema.priceCurrency,
      priceAmountMinor: schema.priceAmountMinor,
      availableQuantity: schema.availableQuantity,
      reservedQuantity: schema.reservedQuantity,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  }
}
