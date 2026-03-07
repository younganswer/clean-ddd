import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery, type ShipmentResult } from '@/shared/shipping';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/shared/readers/shipping/i.shipment.reader';

@QueryHandler(GetShipmentsQuery)
export class ListShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
	constructor(
		@Inject(IShipmentReaderSymbol)
		private readonly shipmentReader: IShipmentReader,
	) {}

	async execute(
		query: GetShipmentsQuery,
	): Promise<PaginatedResult<ShipmentResult>> {
		const { limit, offset } = query;
		const [shipments, total] = await Promise.all([
			this.shipmentReader.findRecent(limit, offset),
			this.shipmentReader.countAll(),
		]);
		const items = shipments;

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			offset,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
