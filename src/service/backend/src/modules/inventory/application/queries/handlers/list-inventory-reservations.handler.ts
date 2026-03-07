import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetInventoryReservationsQuery,
	type InventoryReservationResult,
} from '@/shared/inventory';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/shared/inventory/readers/i.inventory.reader';

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
