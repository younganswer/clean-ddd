import type { ShipmentStatus } from '@/modules/shipping/domain/enums/shipment-status.enum';

type ShipmentSchema = {
	uuid: string;
	orderId: string;
	status: ShipmentStatus;
};

export class ShipmentResult {
	constructor(
		public readonly shipmentId: string,
		public readonly orderId: string,
		public readonly status: ShipmentStatus,
	) {}

	static fromSchema(schema: ShipmentSchema): ShipmentResult {
		return new ShipmentResult(schema.uuid, schema.orderId, schema.status);
	}
}
