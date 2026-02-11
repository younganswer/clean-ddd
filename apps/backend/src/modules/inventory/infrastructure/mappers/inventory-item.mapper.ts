import { Injectable } from '@nestjs/common';
import { InventoryItem } from '../../domains/entities/inventory-item.entity';
import { InventoryItemSchema } from '../schemas/inventory-item.schema';

@Injectable()
export class InventoryItemMapper {
  toDomain(schema: InventoryItemSchema): InventoryItem {
    return InventoryItem.rehydrate({
      sku: schema.sku,
      availableQuantity: schema.availableQuantity,
      reservedQuantity: schema.reservedQuantity,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  }
}
