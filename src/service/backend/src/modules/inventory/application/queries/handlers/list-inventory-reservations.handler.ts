import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IInventoryReservationRepositorySymbol } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';
import {
	GetInventoryReservationsQuery,
	type InventoryReservationResult,
} from '@/shared/inventory';

@QueryHandler(GetInventoryReservationsQuery)
export class ListInventoryReservationsHandler implements IQueryHandler<GetInventoryReservationsQuery> {
	constructor(
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly inventoryReservationRepository: IInventoryReservationRepository,
	) {}

	async execute(
		query: GetInventoryReservationsQuery,
	): Promise<InventoryReservationResult[]> {
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
