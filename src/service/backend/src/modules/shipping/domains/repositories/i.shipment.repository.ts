import { Shipment } from '../entities/aggregates/shipment/shipment.aggregate';

export interface IShipmentRepository {
  createForOrder(orderId: string): Promise<Shipment>;
  findById(id: string): Promise<Shipment | null>;
  findByOrderId(orderId: string): Promise<Shipment | null>;
  findRecent(limit: number, offset?: number): Promise<Shipment[]>;
  countAll(): Promise<number>;
}

export const IShipmentRepositorySymbol = Symbol('I_SHIPMENT_REPOSITORY');
