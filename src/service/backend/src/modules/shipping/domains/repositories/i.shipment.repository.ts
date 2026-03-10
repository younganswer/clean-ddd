import { Shipment } from '@/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';

export interface IShipmentRepository {
	persist(shipment: Shipment): Promise<void>;
	findById(id: string): Promise<Shipment | null>;
	getById(id: string, options?: RepositoryGetByIdOptions): Promise<Shipment>;
	findByOrderId(orderId: string): Promise<Shipment | null>;
	findRecent(options: RepositoryPageOptions<Shipment>): Promise<Shipment[]>;
	countAll(): Promise<number>;
}

export const IShipmentRepositorySymbol = Symbol('I_SHIPMENT_REPOSITORY');
