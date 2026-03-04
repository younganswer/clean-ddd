import { PaginatedView } from '@/shared/readers';
import { OrderView } from '@/shared/readers/ordering/dto/order.view';
import { Query } from '@nestjs/cqrs';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';

export class ListOrdersQuery extends Query<PaginatedView<OrderView>> {
	public readonly limit: number;

	public readonly page: number;

	constructor(limit: number, page: number = 1) {
		super();
		this.limit = toBoundedInt(limit, {
			min: 1,
			max: 50,
			fallback: 20,
		});
		this.page = toBoundedInt(page, {
			min: 1,
			max: Number.MAX_SAFE_INTEGER,
			fallback: 1,
		});
	}
}
