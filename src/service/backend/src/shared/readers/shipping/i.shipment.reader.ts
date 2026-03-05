import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';

export const IShipmentReaderSymbol = Symbol('IShipmentReader');

export interface IShipmentReader {
	findById(id: string): Promise<ShipmentResult | null>;
	findByOrderId(orderId: string): Promise<ShipmentResult | null>;
	findRecent(limit: number): Promise<ShipmentResult[]>;
}
