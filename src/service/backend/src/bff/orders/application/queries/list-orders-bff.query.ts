import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListOrdersBffQuery extends Query<OrderView[]> {
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
