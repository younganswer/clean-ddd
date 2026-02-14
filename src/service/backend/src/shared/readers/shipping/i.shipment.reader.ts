import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';

export const IShipmentReaderSymbol = Symbol('IShipmentReader');

export interface IShipmentReader {
  findById(shipmentId: string): Promise<ShipmentView | null>;
  findByOrderId(orderId: string): Promise<ShipmentView | null>;
  findRecent(limit: number): Promise<ShipmentView[]>;
}
