import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetShipmentsQuery } from '@/modules/shipping/application/queries/get-shipments.query';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/modules/shipping/domain/readers/i.shipment.reader';

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
			this.shipmentReader.findRecent({ limit, offset }),
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
