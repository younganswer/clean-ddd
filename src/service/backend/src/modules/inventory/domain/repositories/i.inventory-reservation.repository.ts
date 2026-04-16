import { InventoryReservation } from '@/modules/inventory/domain/entities/inventory-reservation.entity';

export interface IInventoryReservationRepository {
	persist(reservation: InventoryReservation): Promise<void>;
	delete(reservation: InventoryReservation): Promise<void>;
	findReservationsByOrderId(orderId: string): Promise<InventoryReservation[]>;
	findByOrderAndSku(
		orderId: string,
		sku: string,
	): Promise<InventoryReservation | null>;
}

export const IInventoryReservationRepositorySymbol = Symbol(
	'I_INVENTORY_RESERVATION_REPOSITORY',
);
