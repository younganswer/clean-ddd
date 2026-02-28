import type { ShipmentStatus } from '@/shared/shipping/enums/shipment-status.enum';

export type ShipmentView = {
	shipmentId: string;
	orderId: string;
	status: ShipmentStatus;
};
