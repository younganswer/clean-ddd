import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetShipmentQuery } from '@/modules/shipping/application/queries/get-shipment.query';
import type { ShipmentResult } from '@/modules/shipping/domains/readers/shipment.result';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/modules/shipping/domains/readers/i.shipment.reader';

@QueryHandler(GetShipmentQuery)
export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery> {
	constructor(
		@Inject(IShipmentReaderSymbol)
		private readonly shipmentReader: IShipmentReader,
	) {}

	async execute(query: GetShipmentQuery): Promise<ShipmentResult | null> {
		return await this.shipmentReader.findById(query.shipmentId);
	}
}
