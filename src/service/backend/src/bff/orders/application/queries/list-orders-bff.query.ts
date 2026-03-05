import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListOrdersBffQuery extends Query<OrderResult[]> {
	public readonly input: { limit: number };

	constructor(input: { limit?: number }) {
		super();
		this.input = {
			limit: toBoundedInt(input.limit, {
				min: 1,
				max: 50,
				fallback: 20,
			}),
		};
	}
}
