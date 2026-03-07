import { PaginatedResult } from '@/common/types/paginated.result';
import { OrderResult } from '@/modules/ordering/domains/readers/order.result';
import { Query } from '@nestjs/cqrs';
import { toBoundedInt } from '@/common/cqrs/input-normalizer';

export class GetOrdersQuery extends Query<PaginatedResult<OrderResult>> {
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { limit: number; offset?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 50,
			fallback: 20,
		});
		this.offset = toBoundedInt(input.offset, {
			min: 0,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 0,
		});
	}
}
