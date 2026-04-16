import { Query } from '@nestjs/cqrs';
import type { PaginatedResult } from '@/common/types/paginated.result';
import type { ShipmentResult } from '@/modules/shipping/domain/readers/shipment.result';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';

export class GetShipmentsQuery extends Query<PaginatedResult<ShipmentResult>> {
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { limit?: number; offset?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 100,
			fallback: 20,
		});
		this.offset = toBoundedInt(input.offset, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
	}
}
