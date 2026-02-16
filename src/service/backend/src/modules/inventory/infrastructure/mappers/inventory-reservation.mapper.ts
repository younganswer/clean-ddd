import { Injectable } from '@nestjs/common';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';

@Injectable()
export class InventoryReservationMapper {
  toDomain(schema: InventoryReservationSchema): InventoryReservation {
    if (schema.id == null) {
      throw new Error('InventoryReservationSchema.id is required');
    }

    return InventoryReservation.rehydrate({
      id: schema.id,
      uuid: schema.uuid,
      orderId: schema.orderId,
      sku: schema.sku,
      quantity: schema.quantity,
      createdAt: schema.createdAt,
    });
  }
}
