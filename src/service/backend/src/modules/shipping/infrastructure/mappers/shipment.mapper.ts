import { Injectable } from '@nestjs/common';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';

@Injectable()
export class ShipmentMapper {
  toDomain(schema: ShipmentSchema): Shipment {
    return Shipment.rehydrate({
      id: schema.uuid,
      orderId: schema.orderId,
      status: schema.status,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    });
  }
}
