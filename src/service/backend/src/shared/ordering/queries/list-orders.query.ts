import { PaginatedView } from '@/shared/readers';
import { OrderView } from '@/shared/readers/ordering/dto/order.view';
import { Query } from '@nestjs/cqrs';

export class ListOrdersQuery extends Query<PaginatedView<OrderView>> {
	constructor(
		public readonly limit: number,
		public readonly page: number = 1,
	) {
		super();
	}
}
