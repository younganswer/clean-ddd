import type { ShipmentStatus } from '../../domains/shipment-status';

export type ShipmentView = {
  shipmentId: string;
  orderId: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
};
