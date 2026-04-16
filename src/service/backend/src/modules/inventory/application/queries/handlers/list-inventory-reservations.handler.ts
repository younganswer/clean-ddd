import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetInventoryReservationsQuery } from '@/modules/inventory/application/queries/get-inventory-reservations.query';
import type { InventoryReservationResult } from '@/modules/inventory/domain/readers/inventory-reservation.result';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domain/readers/i.inventory.reader';

@QueryHandler(GetInventoryReservationsQuery)
export class ListInventoryReservationsHandler implements IQueryHandler<GetInventoryReservationsQuery> {
	constructor(
		@Inject(IInventoryReaderSymbol)
		private readonly inventoryReader: IInventoryReader,
	) {}

	async execute(
		query: GetInventoryReservationsQuery,
	): Promise<InventoryReservationResult[]> {
		return await this.inventoryReader.findReservationsByOrderId(
			query.orderId,
		);
	}
}
