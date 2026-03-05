import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { GetShipmentQuery, type ShipmentResult } from '@/shared/shipping';

@QueryHandler(GetShipmentQuery)
export class GetShipmentHandler implements IQueryHandler<GetShipmentQuery> {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async execute(query: GetShipmentQuery): Promise<ShipmentResult | null> {
		const shipment = await this.shipmentRepository.findById(
			query.shipmentId,
		);
		if (!shipment) return null;

		return {
			shipmentId: shipment.id,
			orderId: shipment.orderId,
			status: shipment.status,
		};
	}
}
