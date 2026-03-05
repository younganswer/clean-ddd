import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

export class ListOrdersBffQuery extends Query<PaginatedResult<OrderResult>> {
	public readonly input: { limit: number; page: number };

	constructor(input: { limit?: number; page?: number }) {
		super();
		this.input = {
			limit: toBoundedInt(input.limit, {
				min: 1,
				max: 50,
				fallback: 20,
			}),
			page: toBoundedInt(input.page, {
				min: 1,
				max: Number.MAX_SAFE_INTEGER,
				fallback: 1,
			}),
		};
	}
}
