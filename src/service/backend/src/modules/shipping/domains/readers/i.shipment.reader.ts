import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';

export const IShipmentReaderSymbol = Symbol('IShipmentReader');

export interface IShipmentReader {
	findById(id: string): Promise<ShipmentResult | null>;
	findByOrderId(orderId: string): Promise<ShipmentResult | null>;
	findRecent(limit: number, offset?: number): Promise<ShipmentResult[]>;
	countAll(): Promise<number>;
}
