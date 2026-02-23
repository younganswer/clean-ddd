import { Injectable } from '@nestjs/common';
import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';

@Injectable()
export class ShipmentMapper {
	toDomain(schema: ShipmentSchema): Shipment {
		if (schema.id == null) {
			throw new Error('ShipmentSchema.id is required');
		}

		return Shipment.rehydrate({
			id: schema.id,
			uuid: schema.uuid,
			orderId: schema.orderId,
			status: schema.status,
			createdAt: schema.createdAt,
			updatedAt: schema.updatedAt,
		});
	}
}
