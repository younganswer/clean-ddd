import { Query } from '@nestjs/cqrs';
import type { OrderView } from '@/shared/ordering/readers/order.view';

export class GetOrderBffQuery extends Query<OrderView | null> {
	constructor(public readonly input: { orderId: string }) {
		super();
	}
}
