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
		private readonly reservations: IInventoryReservationRepository,
	) {}

	async execute(
		query: ListInventoryReservationsQuery,
	): Promise<InventoryReservationView[]> {
		const orderId = String(query.orderId ?? '').trim();
		if (!orderId) return [];

		const rows = await this.reservations.findReservationsByOrderId(orderId);
		return rows.map((r) => ({
			reservationId: r.uuid,
			orderId: r.orderId,
			sku: r.sku,
			quantity: r.quantity,
		}));
	}
}
