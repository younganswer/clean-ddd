import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { ShipmentResult } from '@/shared/readers/shipping/dto/shipment.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListShipmentsQuery extends Query<PaginatedResult<ShipmentResult>> {
	public readonly limit: number;

	public readonly page: number;

	constructor(limit: number, page: number = 1) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 1,
			max: 100,
			fallback: 20,
		});
		this.page = toBoundedInt(page, {
			min: 1,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 1,
		});
	}
}
