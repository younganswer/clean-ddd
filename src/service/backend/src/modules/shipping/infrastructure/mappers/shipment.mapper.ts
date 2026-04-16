import { Injectable } from '@nestjs/common';
import { Shipment } from '@/modules/shipping/domain/entities/aggregates/shipment/shipment.aggregate';
import { ShipmentSchema } from '@/modules/shipping/infrastructure/schemas/shipment.schema';

@Injectable()
export class ShipmentMapper {
	toDomain(schema: ShipmentSchema): Shipment {
		return Shipment.rehydrate({
			uuid: schema.uuid,
			orderId: schema.orderId,
			status: schema.status,
		});
	}

	toSchema(shipment: Shipment): ShipmentSchema {
		const primitives = shipment.toPrimitives();

		return new ShipmentSchema({
			uuid: primitives.shipmentId,
			orderId: primitives.orderId,
			status: primitives.status,
		});
	}
}
