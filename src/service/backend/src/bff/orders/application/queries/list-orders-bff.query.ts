import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';

export class ListOrdersBffQuery extends Query<OrderView[]> {
	constructor(public readonly input: { limit: number }) {
		super();
	}
}
