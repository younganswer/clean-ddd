import { Injectable } from '@nestjs/common';
import { InventoryReservation } from '../../domains/entities/inventory-reservation.entity';
import { InventoryReservationSchema } from '../schemas/inventory-reservation.schema';

@Injectable()
export class InventoryReservationMapper {
  toDomain(schema: InventoryReservationSchema): InventoryReservation {
    return InventoryReservation.rehydrate({
      id: schema.uuid,
      orderId: schema.orderId,
      sku: schema.sku,
      quantity: schema.quantity,
      createdAt: schema.createdAt,
    });
  }
}
