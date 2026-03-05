import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { GetShipmentsQuery, type ShipmentResult } from '@/shared/shipping';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@QueryHandler(GetShipmentsQuery)
export class ListShipmentsHandler implements IQueryHandler<GetShipmentsQuery> {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async execute(
		query: GetShipmentsQuery,
	): Promise<PaginatedResult<ShipmentResult>> {
		const { limit, offset } = query;
		const [shipments, total] = await Promise.all([
			this.shipmentRepository.findRecent(limit, offset),
			this.shipmentRepository.countAll(),
		]);

		const items = shipments.map((shipment) => ({
			shipmentId: shipment.id,
			orderId: shipment.orderId,
			status: shipment.status,
		}));

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
