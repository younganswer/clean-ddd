import type { ShipmentStatus } from '@/shared/shipping/enums/shipment-status.enum';

export type ShipmentResult = {
	shipmentId: string;
	orderId: string;
	status: ShipmentStatus;
};
