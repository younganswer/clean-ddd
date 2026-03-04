import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryReservationRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import {
	ListInventoryReservationsQuery,
	type InventoryReservationView,
} from '@/shared/inventory';

@QueryHandler(ListInventoryReservationsQuery)
export class ListInventoryReservationsHandler implements IQueryHandler<ListInventoryReservationsQuery> {
	constructor(
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly inventoryReservationRepository: IInventoryReservationRepository,
	) {}

	async execute(
		query: ListInventoryReservationsQuery,
	): Promise<InventoryReservationView[]> {
		const rows =
			await this.inventoryReservationRepository.findReservationsByOrderId(
				query.orderId,
			);

		return rows.map((inventoryReservation) => ({
			reservationId: inventoryReservation.id,
			orderId: inventoryReservation.orderId,
			sku: inventoryReservation.sku,
			quantity: inventoryReservation.quantity,
		}));
	}
}
