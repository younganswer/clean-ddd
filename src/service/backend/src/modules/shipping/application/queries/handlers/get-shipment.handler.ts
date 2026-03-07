import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetShipmentQuery, type ShipmentResult } from '@/shared/shipping';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/shared/shipping/readers/i.shipment.reader';

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
