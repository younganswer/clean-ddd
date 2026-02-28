import { Injectable } from '@nestjs/common';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
import { InventoryReservationSchema } from '@/modules/inventory/infrastructure/schemas/inventory-reservation.schema';

@Injectable()
export class InventoryReservationMapper {
	toDomain(schema: InventoryReservationSchema): InventoryReservation {
		return InventoryReservation.rehydrate({
			uuid: schema.uuid,
			orderId: schema.orderId,
			sku: schema.sku,
			quantity: schema.quantity,
		});
	}

	toSchema(reservation: InventoryReservation): InventoryReservationSchema {
		const primitives = reservation.toPrimitives();

		return new InventoryReservationSchema({
			uuid: primitives.inventoryReservationId,
			orderId: primitives.orderId,
			sku: primitives.sku,
			quantity: primitives.quantity,
		});
	}
}
