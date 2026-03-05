import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import {
	GetShipmentByOrderQuery,
	type ShipmentResult,
} from '@/shared/shipping';

@QueryHandler(GetShipmentByOrderQuery)
export class GetShipmentByOrderHandler implements IQueryHandler<GetShipmentByOrderQuery> {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async execute(
		query: GetShipmentByOrderQuery,
	): Promise<ShipmentResult | null> {
		const shipment = await this.shipmentRepository.findByOrderId(
			query.orderId,
		);
		if (!shipment) return null;

		return {
			shipmentId: shipment.id,
			orderId: shipment.orderId,
			status: shipment.status,
		};
	}
}
