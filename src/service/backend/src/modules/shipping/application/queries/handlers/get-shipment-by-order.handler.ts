import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetShipmentByOrderQuery } from '@/modules/shipping/application/queries/get-shipment-by-order.query';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import {
	IShipmentReaderSymbol,
	type IShipmentReader,
} from '@/modules/shipping/domain/readers/i.shipment.reader';

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
