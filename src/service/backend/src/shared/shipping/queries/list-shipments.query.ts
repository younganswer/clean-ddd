import { Query } from '@nestjs/cqrs';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import type { ShipmentView } from '@/shared/readers/shipping/dto/shipment.view';

export class ListShipmentsQuery extends Query<PaginatedView<ShipmentView>> {
	constructor(
		public readonly limit: number,
		public readonly page: number = 1,
	) {
		super();
	}
}
