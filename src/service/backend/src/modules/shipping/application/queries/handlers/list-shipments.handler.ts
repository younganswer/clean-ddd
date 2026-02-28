import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IShipmentRepositorySymbol } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import type { IShipmentRepository } from '@/modules/shipping/domains/repositories/i.shipment.repository';
import { ListShipmentsQuery, type ShipmentView } from '@/shared/shipping';
import type { PaginatedView } from '@/shared/readers/paginated.view';

@QueryHandler(ListShipmentsQuery)
export class ListShipmentsHandler implements IQueryHandler<ListShipmentsQuery> {
	constructor(
		@Inject(IShipmentRepositorySymbol)
		private readonly shipmentRepository: IShipmentRepository,
	) {}

	async execute(
		query: ListShipmentsQuery,
	): Promise<PaginatedView<ShipmentView>> {
		const limit = Math.min(
			100,
			Math.max(1, Number(query.limit ?? 20) || 20),
		);
		const page = Math.max(1, Number(query.page ?? 1) || 1);
		const offset = (page - 1) * limit;
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
			page,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}
