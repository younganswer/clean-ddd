import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetShipmentByOrderQuery,
	type ShipmentResult,
} from '@/shared/shipping';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/shared/shipping/readers/i.shipment.reader';

@QueryHandler(GetShipmentByOrderQuery)
export class GetShipmentByOrderHandler implements IQueryHandler<GetShipmentByOrderQuery> {
	constructor(
		@Inject(IShipmentReaderSymbol)
		private readonly shipmentReader: IShipmentReader,
	) {}

	async execute(
		query: GetShipmentByOrderQuery,
	): Promise<ShipmentResult | null> {
		return await this.shipmentReader.findByOrderId(query.orderId);
	}
}
