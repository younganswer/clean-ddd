import { Query } from '@nestjs/cqrs';
import { OrderView } from '@/shared/ordering/readers/order.view';

export class GetOrderQuery extends Query<OrderView | null> {
	constructor(public readonly orderId: string) {
		super();
	}
}
