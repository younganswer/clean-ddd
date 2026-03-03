import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';

export class ListOrdersByUserIdQuery extends Query<OrderView[]> {
	constructor(
		public readonly userId: string,
		public readonly limit: number = 200,
		public readonly offset: number = 0,
	) {
		super();
	}
}
