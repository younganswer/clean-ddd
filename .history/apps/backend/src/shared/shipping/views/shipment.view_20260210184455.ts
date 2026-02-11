import type { ShipmentStatus } from '../enums/shipment-status.enum';

export type ShipmentView = {
  shipmentId: string;
  orderId: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
};
